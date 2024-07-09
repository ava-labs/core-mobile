import {
  NetworkTokenWithBalance,
  TokenType,
  TokenWithBalanceERC20,
  PTokenWithBalance,
  XTokenWithBalance
} from 'store/balance'
import { ChainId, Network, NetworkVMType } from '@avalabs/chains-sdk'
import {
  BlockchainId,
  CurrencyCode,
  ListPChainBalancesResponse,
  ListXChainBalancesResponse,
  NativeTokenBalance,
  Network as NetworkName
} from '@avalabs/glacier-sdk'
import {
  BalanceServiceProvider,
  GetBalancesParams
} from 'services/balance/types'
import { convertNativeToTokenWithBalance } from 'services/balance/nativeTokenConverter'
import { convertErc20ToTokenWithBalance } from 'services/balance/erc20TokenConverter'
import Logger from 'utils/Logger'
import { Transaction } from '@sentry/types'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import TokenService from 'services/token/TokenService'
import { Avax } from 'types'
import BN from 'bn.js'
import { isBitcoinChainId } from 'utils/network/isBitcoinNetwork'
import { absoluteChain, isXPChain } from 'utils/network/isAvalancheNetwork'
import GlacierService, { GlacierUnhealthyError } from 'services/GlacierService'

export class GlacierBalanceService implements BalanceServiceProvider {
  async isProviderFor(network: Network): Promise<boolean> {
    return await GlacierService.isNetworkSupported(
      absoluteChain(network.chainId)
    )
  }

  async getBalances({
    network,
    accountAddress,
    currency,
    sentryTrx
  }: GetBalancesParams): Promise<
    (
      | NetworkTokenWithBalance
      | TokenWithBalanceERC20
      | PTokenWithBalance
      | XTokenWithBalance
    )[]
  > {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.balance.glacier.get')
      .executeAsync(async () => {
        return await Promise.allSettled([
          ...this.getNativeTokenBalancesForNetwork({
            network,
            address: accountAddress,
            currency,
            sentryTrx
          }),
          this.getErc20BalanceForNetwork(network, accountAddress, currency)
        ])
          .then(
            ([nativeBalance, pChainBalance, xChainBalance, erc20Balances]) => {
              let results: (
                | NetworkTokenWithBalance
                | TokenWithBalanceERC20
                | PTokenWithBalance
                | XTokenWithBalance
              )[] = []
              if (nativeBalance.status === 'fulfilled') {
                results = [nativeBalance.value]
              } else if (this.isChainUnavailableError(nativeBalance.reason)) {
                GlacierService.setGlacierToUnhealthy()
                throw new GlacierUnhealthyError()
              }

              if (erc20Balances.status === 'fulfilled') {
                results = [...results, ...erc20Balances.value]
              }
              if (pChainBalance.status === 'fulfilled') {
                results = [...results, pChainBalance.value]
              }
              if (xChainBalance.status === 'fulfilled') {
                results = [...results, xChainBalance.value]
              }
              return results
            }
          )
          .catch(reason => {
            Logger.error(reason)
            return []
          })
      })
  }

  private getNativeBalance(
    chainId: string,
    address: string,
    currency: string
  ): Promise<NativeTokenBalance> {
    if (
      isBitcoinChainId(Number.parseInt(chainId)) ||
      isXPChain(Number.parseInt(chainId))
    ) {
      return Promise.reject(
        'Chain id not compatible, skipping getNativeBalance'
      )
    }
    return GlacierService.getNativeBalance({
      chainId,
      address,
      currency: currency.toLocaleLowerCase() as CurrencyCode
    }).then(res => res.nativeTokenBalance)
  }

  private getNativeTokenBalancesForNetwork({
    network,
    address,
    currency,
    sentryTrx
  }: {
    network: Network
    address: string
    currency: string
    sentryTrx?: Transaction
  }): [
    Promise<NetworkTokenWithBalance>,
    Promise<PTokenWithBalance>,
    Promise<XTokenWithBalance>
  ] {
    return [
      this.getNativeBalance(network.chainId.toString(), address, currency).then(
        balance => convertNativeToTokenWithBalance(balance)
      ),
      this.getPChainBalance({
        network,
        addresses: [address],
        currency,
        sentryTrx
      }),
      this.getXChainBalance({
        network,
        addresses: [address],
        currency,
        sentryTrx
      })
    ]
  }

  private async getErc20BalanceForNetwork(
    network: Network,
    address: string,
    selectedCurrency: string
  ): Promise<TokenWithBalanceERC20[]> {
    if (isBitcoinChainId(network.chainId) || isXPChain(network.chainId)) {
      return Promise.reject(
        'Chain id not compatible, skipping getErc20BalanceForNetwork'
      )
    }
    const tokensWithBalance: TokenWithBalanceERC20[] = []
    /**
     *  Load all pages to make sure we have all the tokens with balances
     */
    let nextPageToken: string | undefined
    do {
      const response = await GlacierService.listErc20Balances({
        chainId: network.chainId.toString(),
        address,
        currency: selectedCurrency.toLocaleLowerCase() as CurrencyCode,
        // glacier has a cap on page size of 100
        pageSize: 100,
        pageToken: nextPageToken
      })

      tokensWithBalance.push(
        ...convertErc20ToTokenWithBalance(response.erc20TokenBalances, network)
      )
      nextPageToken = response.nextPageToken
    } while (nextPageToken)

    return tokensWithBalance
  }

  async getPChainBalance({
    network,
    addresses,
    currency
  }: {
    network: Network
    addresses: string[]
    currency: string
    sentryTrx?: Transaction
  }): Promise<PTokenWithBalance> {
    if (network.vmName !== NetworkVMType.PVM) {
      return Promise.reject('network not compatible, skipping getPChainBalance')
    }

    const { networkToken } = network
    const nativeTokenId =
      network.pricingProviders?.coingecko?.nativeTokenId ?? ''

    const pChainBalance = await GlacierService.getChainBalance({
      blockchainId: BlockchainId.P_CHAIN,
      network: network.isTestnet ? NetworkName.FUJI : NetworkName.MAINNET,
      addresses: addresses.join(',')
    }).then(value => (value as ListPChainBalancesResponse).balances)

    const {
      price: priceInCurrency,
      marketCap,
      vol24,
      change24
    } = await TokenService.getPriceWithMarketDataByCoinId(
      nativeTokenId,
      currency.toLocaleLowerCase() as VsCurrencyType
    )

    const balance = Avax.fromNanoAvax(
      pChainBalance.unlockedUnstaked[0]?.amount ?? 0
    )
    const balanceDisplayValue = balance.toDisplay()
    const balanceInCurrency = Number.parseFloat(
      balance.mul(priceInCurrency).toString()
    )
    const balanceCurrencyDisplayValue = balance.mul(priceInCurrency).toFixed(2)

    const balanceBN = new BN(balance.toSubUnit(true).toString())
    return {
      balance: balanceBN,
      balanceDisplayValue,
      balanceInCurrency,
      balanceCurrencyDisplayValue,
      priceInCurrency,
      marketCap,
      vol24,
      change24,
      coingeckoId: nativeTokenId,
      type: TokenType.NATIVE,
      ...networkToken,
      ...pChainBalance
    } as PTokenWithBalance
  }

  async getXChainBalance({
    network,
    addresses,
    currency
  }: {
    network: Network
    addresses: string[]
    currency: string
    sentryTrx?: Transaction
  }): Promise<XTokenWithBalance> {
    if (network.vmName !== NetworkVMType.AVM) {
      return Promise.reject('network not compatible, skipping getXChainBalance')
    }

    const { networkToken } = network
    const nativeTokenId =
      network.pricingProviders?.coingecko?.nativeTokenId ?? ''

    const xChainBalance = await GlacierService.getChainBalance({
      blockchainId: BlockchainId.X_CHAIN,
      network: network.isTestnet ? NetworkName.FUJI : NetworkName.MAINNET,
      addresses: addresses.join(',')
    }).then(value => (value as ListXChainBalancesResponse).balances)

    const {
      price: priceInCurrency,
      marketCap,
      vol24,
      change24
    } = await TokenService.getPriceWithMarketDataByCoinId(
      nativeTokenId,
      currency.toLocaleLowerCase() as VsCurrencyType
    )

    const balance = Avax.fromNanoAvax(
      BigInt(xChainBalance.unlocked[0]?.amount ?? 0)
    )
    const balanceDisplayValue = balance.toDisplay()
    const balanceInCurrency = Number.parseFloat(
      balance.mul(priceInCurrency).toString()
    )
    const balanceCurrencyDisplayValue = balance.mul(priceInCurrency).toFixed(2)

    const balanceBN = new BN(balance.toSubUnit(true).toString())
    return {
      balance: balanceBN,
      balanceDisplayValue,
      balanceInCurrency,
      balanceCurrencyDisplayValue,
      priceInCurrency,
      marketCap,
      vol24,
      change24,
      coingeckoId: nativeTokenId,
      type: TokenType.NATIVE,
      ...networkToken,
      ...xChainBalance
    } as XTokenWithBalance
  }

  async getCChainBalance(
    isDeveloperMode: boolean,
    address: string,
    selectedCurrency: string
  ): Promise<NativeTokenBalance> {
    const chainId = isDeveloperMode
      ? ChainId.AVALANCHE_TESTNET_ID
      : ChainId.AVALANCHE_MAINNET_ID

    return this.getNativeBalance(chainId.toString(), address, selectedCurrency)
  }

  private isChainUnavailableError(err: unknown): boolean {
    const message = err instanceof Error ? err.message : String(err)

    return message.includes('Internal Server Error')
  }
}

export default new GlacierBalanceService()

import {
  NetworkTokenWithBalance,
  TokenType,
  TokenWithBalanceERC20,
  XPTokenWithBalance
} from 'store/balance'
import { ChainId, Network } from '@avalabs/chains-sdk'
import {
  BlockchainId,
  CurrencyCode,
  ListPChainBalancesResponse,
  NativeTokenBalance,
  Network as NetworkName
} from '@avalabs/glacier-sdk'
import { glacierSdk } from 'utils/network/glacier'
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

export class GlacierBalanceService implements BalanceServiceProvider {
  async isProviderFor(network: Network): Promise<boolean> {
    const isHealthy = await this.isHealthy()
    if (!isHealthy) {
      return false
    }
    const supportedChainsResp = await glacierSdk.evmChains.supportedChains({})

    const chainInfos = supportedChainsResp.chains
    const chains = chainInfos.map(chain => chain.chainId)
    chains.push(ChainId.AVALANCHE_XP.toString())
    chains.push(ChainId.AVALANCHE_TEST_XP.toString())

    return chains.some(value => value === network.chainId.toString())
  }

  async getBalances({
    network,
    accountAddress,
    currency,
    sentryTrx
  }: GetBalancesParams): Promise<
    (NetworkTokenWithBalance | TokenWithBalanceERC20 | XPTokenWithBalance)[]
  > {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.balance.glacier.get')
      .executeAsync(async () => {
        return await Promise.allSettled([
          this.getNativeTokenBalanceForNetwork(
            network,
            accountAddress,
            currency
          ),
          this.getErc20BalanceForNetwork(network, accountAddress, currency),
          this.getPChainBalance({
            network,
            addresses: [accountAddress],
            currency,
            sentryTrx
          })
        ])
          .then(([nativeBalance, erc20Balances, pChainBalance]) => {
            let results: (
              | NetworkTokenWithBalance
              | TokenWithBalanceERC20
              | XPTokenWithBalance
            )[] =
              nativeBalance.status === 'fulfilled' ? [nativeBalance.value] : []

            if (erc20Balances.status === 'fulfilled') {
              results = [...results, ...erc20Balances.value]
            }
            if (pChainBalance.status === 'fulfilled') {
              results = [...results, pChainBalance.value]
            }
            return results
          })
          .catch(reason => {
            Logger.error(reason)
            return []
          })
      })
  }

  private async isHealthy(): Promise<boolean> {
    try {
      const healthStatus = await glacierSdk.healthCheck.healthCheck()
      const status = healthStatus?.status?.toString()
      return status === 'ok'
    } catch (e) {
      Logger.error('Failed to check glacier health', e)
      return false
    }
  }

  private getNativeBalance(
    chainId: string,
    address: string,
    currency: string
  ): Promise<NativeTokenBalance> {
    return glacierSdk.evmBalances
      .getNativeBalance({
        chainId,
        address,
        currency: currency.toLocaleLowerCase() as CurrencyCode
      })
      .then(res => res.nativeTokenBalance)
  }

  private getNativeTokenBalanceForNetwork(
    network: Network,
    address: string,
    currency: string
  ): Promise<NetworkTokenWithBalance> {
    return this.getNativeBalance(
      network.chainId.toString(),
      address,
      currency
    ).then(balance => convertNativeToTokenWithBalance(balance))
  }

  private async getErc20BalanceForNetwork(
    network: Network,
    address: string,
    selectedCurrency: string
  ): Promise<TokenWithBalanceERC20[]> {
    const tokensWithBalance: TokenWithBalanceERC20[] = []
    /**
     *  Load all pages to make sure we have all the tokens with balances
     */
    let nextPageToken: string | undefined
    do {
      const response = await glacierSdk.evmBalances.listErc20Balances({
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
  }): Promise<XPTokenWithBalance> {
    const { networkToken } = network
    const nativeTokenId =
      network.pricingProviders?.coingecko?.nativeTokenId ?? ''

    const pChainBalance = await glacierSdk.primaryNetworkBalances
      .getBalancesByAddresses({
        blockchainId: BlockchainId.P_CHAIN,
        network: network.isTestnet ? NetworkName.FUJI : NetworkName.MAINNET,
        addresses: addresses.join(',')
      })
      .then(value => (value as ListPChainBalancesResponse).balances)

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
    } as XPTokenWithBalance
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
}

export default new GlacierBalanceService()

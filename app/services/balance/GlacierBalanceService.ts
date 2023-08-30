import { NetworkTokenWithBalance, TokenWithBalanceERC20 } from 'store/balance'
import { ChainId, Network } from '@avalabs/chains-sdk'
import {
  BlockchainId,
  CurrencyCode,
  ListPChainBalancesResponse,
  NativeTokenBalance,
  Network as NetworkName,
  PChainBalance
} from '@avalabs/glacier-sdk'
import { glacierSdk } from 'utils/network/glacier'
import { BalanceServiceProvider } from 'services/balance/types'
import { convertNativeToTokenWithBalance } from 'services/balance/nativeTokenConverter'
import { convertErc20ToTokenWithBalance } from 'services/balance/erc20TokenConverter'
import Logger from 'utils/Logger'
import { Transaction } from '@sentry/types'
import SentryWrapper from 'services/sentry/SentryWrapper'

export class GlacierBalanceService implements BalanceServiceProvider {
  async isProviderFor(network: Network): Promise<boolean> {
    const isHealthy = await this.isHealthy()
    if (!isHealthy) {
      return false
    }
    const supportedChainsResp = await glacierSdk.evmChains.supportedChains({})

    const chainInfos = supportedChainsResp.chains
    const chains = chainInfos.map(chain => chain.chainId)

    return chains.some(value => value === network.chainId.toString())
  }

  async getBalances(
    network: Network,
    userAddress: string,
    currency: string,
    sentryTrx?: Transaction
  ): Promise<(NetworkTokenWithBalance | TokenWithBalanceERC20)[]> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.balance.glacier.get')
      .executeAsync(async () => {
        return await Promise.allSettled([
          this.getNativeTokenBalanceForNetwork(network, userAddress, currency),
          this.getErc20BalanceForNetwork(network, userAddress, currency)
        ])
          .then(([nativeBalance, erc20Balances]) => {
            let results: (NetworkTokenWithBalance | TokenWithBalanceERC20)[] =
              nativeBalance.status === 'fulfilled' ? [nativeBalance.value] : []

            if (erc20Balances.status === 'fulfilled') {
              results = [...results, ...erc20Balances.value]
            }
            return results
          })
          .catch(() => {
            return []
          })
      })
  }

  private async isHealthy() {
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
    selectedCurrency: string
  ) {
    return glacierSdk.evmBalances
      .getNativeBalance({
        chainId,
        address,
        currency: selectedCurrency.toLocaleLowerCase() as CurrencyCode
      })
      .then(res => res.nativeTokenBalance)
  }

  private getNativeTokenBalanceForNetwork(
    network: Network,
    address: string,
    selectedCurrency: string
  ): Promise<NetworkTokenWithBalance> {
    return this.getNativeBalance(
      network.chainId.toString(),
      address,
      selectedCurrency
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

  async getPChainBalance(
    isDeveloperMode: boolean,
    addresses: string[],
    _sentryTrx?: Transaction
  ): Promise<PChainBalance> {
    return glacierSdk.primaryNetworkBalances
      .getBalancesByAddresses({
        blockchainId: BlockchainId.P_CHAIN,
        network: isDeveloperMode ? NetworkName.FUJI : NetworkName.MAINNET,
        addresses: addresses.join(',')
      })
      .then(value => (value as ListPChainBalancesResponse).balances)
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

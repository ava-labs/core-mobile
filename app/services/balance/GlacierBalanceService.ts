import { NetworkTokenWithBalance, TokenWithBalanceERC20 } from 'store/balance'
import { Network } from '@avalabs/chains-sdk'
import { CurrencyCode, GlacierClient } from '@avalabs/glacier-sdk'
import { GLACIER_URL } from 'utils/glacierUtils'
import { BalanceServiceProvider } from 'services/balance/types'
import { convertNativeToTokenWithBalance } from 'services/balance/nativeTokenConverter'
import { convertErc20ToTokenWithBalance } from 'services/balance/erc20TokenConverter'

export class GlacierBalanceService implements BalanceServiceProvider {
  private glacierSdk = new GlacierClient(GLACIER_URL)

  async isProviderFor(network: Network): Promise<boolean> {
    const isHealthy = await this.isHealthy()
    if (!isHealthy) {
      return false
    }
    const supportedChainsResp = await this.glacierSdk.supportedChains()
    const chainInfos = supportedChainsResp.chains
    const chains = chainInfos.map(chain => chain.chainId)
    return chains.some(value => value === network.chainId.toString())
  }

  async getBalances(
    network: Network,
    userAddress: string,
    currency: string
  ): Promise<(NetworkTokenWithBalance | TokenWithBalanceERC20)[]> {
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
  }

  private async isHealthy() {
    try {
      const healthStatus = await this.glacierSdk.healthCheck()
      const status = healthStatus?.status?.toString()
      return status === 'ok'
    } catch (e) {
      console.error(e)
      return false
    }
  }

  private getNativeTokenBalanceForNetwork(
    network: Network,
    address: string,
    selectedCurrency: string
  ): Promise<NetworkTokenWithBalance> {
    return this.glacierSdk
      .getNativeBalance(network.chainId.toString(), address, {
        currency: selectedCurrency.toLocaleLowerCase() as CurrencyCode
      })
      .then(res => res.nativeTokenBalance)
      .then(balance => convertNativeToTokenWithBalance(balance))
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
      const response = await this.glacierSdk.listErc20Balances(
        network.chainId.toString(),
        address,
        {
          currency: selectedCurrency.toLocaleLowerCase() as CurrencyCode,
          // glacier has a cap on page size of 100
          pageSize: 100,
          pageToken: nextPageToken
        }
      )

      tokensWithBalance.push(
        ...convertErc20ToTokenWithBalance(response.erc20TokenBalances)
      )
      nextPageToken = response.nextPageToken
    } while (nextPageToken)

    return tokensWithBalance
  }
}

export default new GlacierBalanceService()

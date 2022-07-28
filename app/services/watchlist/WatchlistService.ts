import { Network, NetworkContractToken } from '@avalabs/chains-sdk'
import {
  TokenType,
  TokenWithBalance,
  TokenWithBalanceERC20
} from 'store/balance'
import {
  SimpleTokenPriceResponse,
  VsCurrencyType
} from '@avalabs/coingecko-sdk'
import tokenService from 'services/token/TokenService'

class WatchlistService {
  async getBalances(
    network: Network,
    currency: string
  ): Promise<TokenWithBalance[]> {
    const activeTokenList = network.tokens ?? []
    const tokenAddresses = activeTokenList.map(token => token.address)

    const assetPlatformId =
      network.pricingProviders?.coingecko?.assetPlatformId ?? ''

    const tokenPriceDict =
      (assetPlatformId &&
        (await tokenService.getPricesWithMarketDataByAddresses(
          tokenAddresses,
          assetPlatformId,
          currency as VsCurrencyType
        ))) ||
      {}

    const erc20Tokens = await this.getErc20Balances(
      activeTokenList,
      tokenPriceDict,
      network,
      currency
    )

    return erc20Tokens
  }

  private async getErc20Balances(
    activeTokenList: NetworkContractToken[],
    tokenPriceDict: SimpleTokenPriceResponse,
    network: Network,
    currency: string
  ): Promise<TokenWithBalance[]> {
    const { chainId } = network

    return Promise.allSettled(
      activeTokenList.map(async token => {
        const id = `${chainId}-${token.address}`
        const tokenPrice =
          tokenPriceDict[token.address.toLowerCase()]?.[
            currency as VsCurrencyType
          ]
        const priceUSD = tokenPrice?.price ?? 0
        const marketCap = tokenPrice?.marketCap ?? 0
        const change24 = tokenPrice?.change24 ?? 0
        const vol24 = tokenPrice?.vol24 ?? 0

        return {
          ...token,
          id,
          type: TokenType.ERC20,
          priceInCurrency: priceUSD,
          marketCap,
          change24,
          vol24
        } as TokenWithBalanceERC20
      })
    ).then(res => {
      return res.reduce<TokenWithBalanceERC20[]>((acc, result) => {
        return result.status === 'fulfilled' ? [...acc, result.value] : acc
      }, [])
    })
  }
}

export default new WatchlistService()

import { Network, NetworkContractToken } from '@avalabs/chains-sdk'
import {
  TokenType,
  TokenWithBalance,
  TokenWithBalanceERC20
} from 'store/balance'
import {
  SimplePriceResponse,
  SimpleTokenPriceResponse,
  VsCurrencyType
} from '@avalabs/coingecko-sdk'
import tokenService from 'services/token/TokenService'
import { MarketToken } from 'store/watchlist'
import Logger from 'utils/Logger'

class WatchlistService {
  async getMarketData(
    network: Network,
    currency: string,
    networks: Network[]
  ): Promise<MarketToken[]> {
    const marketTokens =
      (await tokenService.getTopTokenMarket(currency as VsCurrencyType)).map(
        mt => {
          return {
            id: mt.id,
            symbol: mt.symbol.toUpperCase(),
            logoUri: mt.image,
            type: TokenType.NATIVE,
            priceInCurrency: mt.price
          } as MarketToken
        }
      ) ?? []

    const networkTokens =
      networks
        .map(
          nt =>
            nt.tokens?.map(tk => {
              return {
                id: tk.address,
                symbol: tk.symbol.toUpperCase(),
                logoUri: tk.logoUri,
                type: TokenType.ERC20,
                assetPlatformId: nt.pricingProviders?.coingecko.assetPlatformId
              } as MarketToken
            }) ?? []
        )
        ?.flat() ?? []
    const allTokens = marketTokens.concat(networkTokens)

    const promises = []
    promises.push(
      tokenService.fetchPriceWithMarketData(
        marketTokens.map((tk: any) => tk.id),
        currency.toLowerCase() as VsCurrencyType
      )
    )

    for (const nt of networks) {
      const assetPlatformId =
        nt.pricingProviders?.coingecko?.assetPlatformId ?? ''
      const tokenAddresses =
        nt?.tokens?.map(token => token.address.toLowerCase()) ?? []
      if (tokenAddresses.length > 0) {
        promises.push(
          tokenService.getPricesWithMarketDataByAddresses(
            tokenAddresses,
            assetPlatformId,
            currency.toLowerCase() as VsCurrencyType
          )
        )
      }
    }

    const tokenPriceDict:
      | SimpleTokenPriceResponse
      | SimplePriceResponse
      | undefined = (await Promise.allSettled(promises)).reduce(
      (prev, result) => {
        return result.status === 'fulfilled'
          ? { ...prev, ...result.value }
          : prev
      },
      {}
    )

    const data =
      allTokens.map((token: MarketToken) => {
        if (token.symbol === 'SNOB') {
          Logger.warn('stop here')
        }
        const tokenPrice =
          tokenPriceDict[token.id.toLowerCase()]?.[currency as VsCurrencyType]
        const priceUSD = tokenPrice?.price ?? 0
        const marketCap = tokenPrice?.marketCap ?? 0
        const change24 = tokenPrice?.change24 ?? 0
        const vol24 = tokenPrice?.vol24 ?? 0

        if (token.type === TokenType.ERC20) {
          Logger.warn('got here')
        }

        return {
          ...token,
          coingeckoId: token.type === TokenType.NATIVE && token.id,
          priceInCurrency: priceUSD,
          marketCap,
          change24,
          vol24
        } as MarketToken
      }) ?? []

    return data
  }

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

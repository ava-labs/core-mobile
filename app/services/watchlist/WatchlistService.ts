import { Network } from '@avalabs/chains-sdk'
import { TokenType } from 'store/balance'
import {
  SimplePriceResponse,
  SimpleTokenPriceResponse,
  VsCurrencyType
} from '@avalabs/coingecko-sdk'
import tokenService from 'services/token/TokenService'
import { MarketToken } from 'store/watchlist'

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
            name: mt.name,
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
                name: tk.name,
                symbol: tk.symbol.toUpperCase(),
                logoUri: tk.logoUri,
                type: TokenType.ERC20,
                assetPlatformId: nt.pricingProviders?.coingecko.assetPlatformId
              } as MarketToken
            }) ?? []
        )
        ?.flat() ?? []

    // Remove duplicates based on symbol (weak) because each
    // subnet tokens have their own USDC (for instance).
    // A robust data service is needed to properly serve this data.
    const allTokens = networkTokens.reduce(
      (acc, item) => {
        return acc.find(tk => tk.symbol === item.symbol) ? acc : [...acc, item]
      },
      [...marketTokens]
    )

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
        const tokenPrice =
          tokenPriceDict[token.id.toLowerCase()]?.[currency as VsCurrencyType]
        const priceUSD = tokenPrice?.price ?? 0
        const marketCap = tokenPrice?.marketCap ?? 0
        const change24 = tokenPrice?.change24 ?? 0
        const vol24 = tokenPrice?.vol24 ?? 0

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

  async tokenSearch(query: string) {
    const coins = await tokenService.getTokenSearch(query)
    if (coins) {
      const ids = coins.map((tk: MarketToken) => tk.id)
      const prices = await tokenService.fetchPriceWithMarketData(
        ids,
        'usd' as VsCurrencyType
      )

      return coins.map(coin => {
        const tokenPrice =
          prices?.[coin.id.toLowerCase()]?.['usd' as VsCurrencyType]
        const priceUSD = tokenPrice?.price ?? 0
        const marketCap = tokenPrice?.marketCap ?? 0
        const change24 = tokenPrice?.change24 ?? 0
        const vol24 = tokenPrice?.vol24 ?? 0

        return {
          ...coin,
          coingeckoId: coin.id,
          type: TokenType.NATIVE,
          priceInCurrency: priceUSD,
          marketCap,
          change24,
          vol24
        } as MarketToken
      })
    }
    return []
  }
}

export default new WatchlistService()

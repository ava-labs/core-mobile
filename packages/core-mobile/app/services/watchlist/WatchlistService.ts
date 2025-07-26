import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import TokenService from 'services/token/TokenService'
import {
  SimplePriceResponse,
  CoinMarket,
  SimplePriceInCurrencyResponse,
  TrendingToken
} from 'services/token/types'
import { transformSparklineData } from 'services/token/utils'
import {
  Charts,
  MarketToken,
  MarketType,
  PriceData,
  Prices
} from 'store/watchlist/types'
import Logger from 'utils/Logger'

/*
 WatchlistService handles the following 3 API calls:
  1. getTokens: get token data from cache
  2. getPrices
    - get price data from cache
    - get price data from network (tokens not in cache)
  3. tokenSearch
    - get token Id from network
    - get price and market data from cached
    - get price and market data from network (tokens not in cache)
*/
class WatchlistService {
  async getTokens(currency: string): Promise<{
    tokens: Record<string, MarketToken>
    charts: Charts
  }> {
    const cachedTokens = await TokenService.getMarketsFromWatchlistCache({
      currency: currency.toLowerCase() as VsCurrencyType
    })

    const tokens: Record<string, MarketToken> = {}
    const charts: Charts = {}

    cachedTokens.forEach(token => {
      const id = token.internalId

      const tokenToAdd = {
        marketType: MarketType.TOP,
        id,
        coingeckoId: token.coingeckoId,
        platforms: token.platforms,
        symbol: token.symbol,
        name: token.name,
        logoUri: token.image,
        currentPrice: token.current_price ?? undefined,
        priceChange24h: token.price_change_24h ?? undefined,
        priceChangePercentage24h: token.price_change_percentage_24h ?? undefined
      }

      tokens[id] = tokenToAdd

      if (token.sparkline_in_7d?.price) {
        charts[id] = transformSparklineData(token.sparkline_in_7d.price)
      }
    })

    return { tokens, charts }
  }

  async getPrices(coingeckoIds: string[], currency: string): Promise<Prices> {
    const allPriceData = await TokenService.fetchPriceWithMarketData()
    const prices: Prices = {}
    const otherIds: string[] = []

    coingeckoIds.forEach(tokenId => {
      const pricesInCurrency = allPriceData?.[tokenId]

      if (!pricesInCurrency) {
        otherIds.push(tokenId)
        return
      }
      prices[tokenId] = this.getPriceInCurrency(pricesInCurrency, currency)
    })

    if (otherIds.length !== 0) {
      const otherPriceData = await TokenService.getSimplePrice({
        coinIds: otherIds,
        currency: currency as VsCurrencyType
      })

      for (const tokenId in otherPriceData) {
        const otherPriceInCurrency = otherPriceData?.[tokenId]
        if (!otherPriceInCurrency) {
          continue
        }
        prices[tokenId] = this.getPriceInCurrency(
          otherPriceInCurrency,
          currency
        )
      }
    }

    return prices
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  async tokenSearch(
    query: string,
    currency: string
  ): Promise<
    { tokens: MarketToken[]; charts: Charts; prices: Prices } | undefined
  > {
    const coins = await TokenService.getTokenSearch(query)

    const coinIds = coins?.map(tk => tk.id)

    if (coinIds && coinIds.length > 0) {
      const pricePromise = this.getPriceWithMarketDataByCoinIds(
        coinIds,
        currency
      )

      const marketPromise = this.getMarketsByCoinIds(coinIds, currency)

      const [pricesRaw, marketsRaw] = await Promise.all([
        pricePromise,
        marketPromise
      ])

      const tokens: MarketToken[] = []
      const charts: Charts = {}
      const prices: Prices = {}

      marketsRaw.forEach(market => {
        // Create a synthetic internalId for search results since they don't have one
        const syntheticInternalId = `search:${market.id}`

        tokens.push({
          marketType: MarketType.SEARCH,
          id: syntheticInternalId,
          coingeckoId: market.id,
          platforms: {}, // Search results don't have platform info
          symbol: market.symbol,
          name: market.name,
          logoUri: market.image,
          // also adding the price change 24h and price change percentage 24h
          // since we don't always able to get those info when fetching prices (when doing a simple price request)
          priceChange24h:
            typeof market.price_change_24h === 'number'
              ? market.price_change_24h
              : undefined,
          priceChangePercentage24h:
            typeof market.price_change_percentage_24h === 'number'
              ? market.price_change_percentage_24h
              : undefined,
          currentPrice:
            pricesRaw?.[market.id]?.[currency as VsCurrencyType]?.price ??
            undefined
        })

        if (market.sparkline_in_7d?.price) {
          charts[market.id] = transformSparklineData(
            market.sparkline_in_7d.price
          )
        }
      })

      for (const tokenId in pricesRaw) {
        const pricesInCurrency = pricesRaw[tokenId]
        if (!pricesInCurrency) continue
        const price = pricesInCurrency[currency as VsCurrencyType]
        prices[tokenId] = {
          priceInCurrency: price?.price ?? 0,
          change24: price?.change24 ?? 0,
          marketCap: price?.marketCap ?? 0,
          vol24: price?.vol24 ?? 0
        }
      }

      return { tokens, charts, prices }
    }

    return undefined
  }

  async getTrendingTokens(
    exchangeRate: number | undefined
  ): Promise<TrendingToken[]> {
    return TokenService.getTrendingTokens(exchangeRate)
  }

  private getPriceInCurrency(
    priceData: SimplePriceInCurrencyResponse,
    currency: string
  ): PriceData {
    const price = priceData[currency as VsCurrencyType]
    return {
      priceInCurrency: price?.price ?? 0,
      change24: price?.change24 ?? 0,
      marketCap: price?.marketCap ?? 0,
      vol24: price?.vol24 ?? 0
    }
  }

  private async getPriceWithMarketDataByCoinIds(
    coinIds: string[],
    currency: string
  ): Promise<SimplePriceResponse | undefined> {
    try {
      return TokenService.getSimplePrice({
        coinIds,
        currency: currency as VsCurrencyType
      })
    } catch (error) {
      Logger.error('Failed to fetch price data', { error })
      return undefined
    }
  }

  private async getMarketsByCoinIds(
    coinIds: string[],
    currency: string
  ): Promise<CoinMarket[]> {
    try {
      return TokenService.getMarkets({
        coinIds,
        currency: currency as VsCurrencyType,
        sparkline: true
      })
    } catch (error) {
      Logger.error('Failed to fetch market data', { error })
      return []
    }
  }
}

export default new WatchlistService()

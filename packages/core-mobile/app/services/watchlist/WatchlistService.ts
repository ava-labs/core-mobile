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
  1. getTokens
    - get token data from cache
    - get token data from network (tokens not in cache)
  2. getPrices
    - get price data from cache
    - get price data from network (tokens not in cache)
  3. tokenSearch
    - get token Id from network
    - get price and market data from cached
    - get price and market data from network (tokens not in cache)
*/
class WatchlistService {
  async getTokens(
    currency: string,
    cachedFavoriteTokenIds: string[]
  ): Promise<{
    tokens: Record<string, MarketToken>
    charts: Charts
  }> {
    const cachedTokens = await TokenService.getMarketsFromWatchlistCache({
      currency: currency.toLowerCase() as VsCurrencyType
    })

    const cachedTokenIds = cachedTokens.map(token => token.id)
    let otherTokens: CoinMarket[] = []
    const tokens: Record<string, MarketToken> = {}
    const charts: Charts = {}

    // collect favorited token ids that are not in the cache
    const tokenIdsToFetch = cachedFavoriteTokenIds.filter(
      tk => !cachedTokenIds.includes(tk)
    )

    if (tokenIdsToFetch.length !== 0) {
      // network contract tokens and favorite tokens
      otherTokens = await TokenService.getMarkets({
        currency: currency as VsCurrencyType,
        coinIds: tokenIdsToFetch,
        sparkline: true
      })
    }

    // get tokens and chart from cached and fetched tokens
    cachedTokens.concat(otherTokens).forEach(token => {
      const tokenToAdd = {
        marketType: MarketType.TOP,
        id: token.id,
        symbol: token.symbol,
        name: token.name,
        logoUri: token.image,
        currentPrice: token.current_price ?? undefined,
        priceChange24h: token.price_change_24h ?? undefined,
        priceChangePercentage24h: token.price_change_percentage_24h ?? undefined
      }

      tokens[token.id] = tokenToAdd

      if (token.sparkline_in_7d?.price) {
        charts[token.id] = transformSparklineData(token.sparkline_in_7d.price)
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
        tokens.push({
          marketType: MarketType.TOP,
          id: market.id,
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
    const cachedPriceData = await TokenService.getPriceWithMarketDataByCoinIds(
      coinIds
    )

    if (
      cachedPriceData === undefined ||
      Object.keys(cachedPriceData).length !== coinIds.length
    ) {
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
    return cachedPriceData
  }

  private async getMarketsByCoinIds(
    coinIds: string[],
    currency: string
  ): Promise<CoinMarket[]> {
    const cachedMarketData = await TokenService.getMarketsFromWatchlistCache({
      currency: currency as VsCurrencyType
    })
    if (
      cachedMarketData === undefined ||
      Object.keys(cachedMarketData).length !== coinIds.length
    ) {
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
    return cachedMarketData
  }
}

export default new WatchlistService()

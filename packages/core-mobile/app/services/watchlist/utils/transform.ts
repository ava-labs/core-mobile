import { TrendingToken } from 'services/token/types'
import { Charts, MarketToken, MarketType, Prices } from 'store/watchlist/types'
import { transformMartketChartRawPrices } from 'services/token/utils'

export const transformTrendingTokens = (
  trendingTokens: TrendingToken[]
): {
  tokens: Record<string, MarketToken>
  charts: Charts
  prices: Prices
} => {
  const tokens: Record<string, MarketToken> = {}
  const charts: Charts = {}
  const prices: Prices = {}

  for (const token of trendingTokens) {
    const id = token.address

    if (token.sparkline) {
      charts[id] = transformMartketChartRawPrices(
        token.sparkline.map(entry => {
          const timestamp = entry.unixTime * 1000 // convert unix timestamp in seconds to milliseconds
          return [timestamp, entry.value]
        })
      )
    }

    const priceChange24h = charts[id]?.ranges.diffValue ?? 0

    tokens[id] = {
      marketType: MarketType.TRENDING,
      id,
      symbol: token.symbol,
      name: token.name,
      logoUri: token.logoURI ?? undefined,
      currentPrice: token.price,
      priceChangePercentage24h:
        charts[id]?.ranges.percentChange ??
        token.price24hChangePercent ??
        undefined,
      priceChange24h
    }

    prices[id] = {
      priceInCurrency: token.price,
      change24: priceChange24h,
      marketCap: token.marketcap ?? 0,
      vol24: token.volume24hUSD ?? 0
    }
  }

  return {
    tokens,
    charts,
    prices
  }
}

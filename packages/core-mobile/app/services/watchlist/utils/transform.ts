import { TrendingToken } from 'utils/api/types'
import { Charts, MarketToken, MarketType, Prices } from 'store/watchlist/types'
import { transformMartketChartRawPrices } from 'services/token/utils'

export const applyExchangeRateToTrendingTokens = (
  trendingTokens: TrendingToken[],
  exchangeRate: number
): TrendingToken[] => {
  return trendingTokens.map(item => ({
    ...item,
    price:
      typeof item.price === 'number' ? item.price * exchangeRate : item.price,
    marketcap:
      typeof item.marketcap === 'number'
        ? item.marketcap * exchangeRate
        : item.marketcap,
    fdv: typeof item.fdv === 'number' ? item.fdv * exchangeRate : item.fdv,
    volume24hUSD:
      typeof item.volume24hUSD === 'number'
        ? item.volume24hUSD * exchangeRate
        : item.volume24hUSD,
    liquidity:
      typeof item.liquidity === 'number'
        ? item.liquidity * exchangeRate
        : item.liquidity,
    sparkline: item.sparkline
      ? item.sparkline.map(point => ({
          ...point,
          value: point.value * exchangeRate
        }))
      : item.sparkline
  }))
}

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
    const id = token.internalId

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
      coingeckoId: token.coingeckoId,
      platforms: token.platforms ?? {},
      symbol: token.symbol,
      name: token.name,
      logoUri: token.logoURI ?? undefined,
      currentPrice: token.price ?? undefined,
      priceChangePercentage24h:
        charts[id]?.ranges.percentChange ??
        token.price24hChangePercent ??
        undefined,
      priceChange24h
    }

    prices[id] = {
      priceInCurrency: token.price ?? 0,
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

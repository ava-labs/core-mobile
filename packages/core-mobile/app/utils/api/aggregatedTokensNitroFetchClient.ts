import { WatchlistMarketsResponse, SimplePriceResponse, TrendingToken } from 'utils/api/types'
import { proxyApi } from './clients/proxyApiClient'

export const getV1watchlistmarkets = async (
  currency: string
): Promise<WatchlistMarketsResponse> => {
  const { data, error } = await proxyApi.GET(
    '/v1/watchlist/markets',
    {
      params: {
        query: {
          currency,
          topMarkets: true
        }
      }
    }
  )

  if (error) {
    throw error
  }

  return data
}

export const getPrices = async (
  params?: Record<string, never>
): Promise<SimplePriceResponse> => {
  const { data, error } = await proxyApi.GET('/v1/watchlist/price', {
    params
  })

  if (error) {
    throw error
  }

  return data
}

export const getTrendingTokens = async (
  params?: Record<string, never>
): Promise<TrendingToken[]> => {
  const { data, error } = await proxyApi.GET('/v1/watchlist/trending', {
    params
  })

  if (error) {
    throw error
  }

  return data
}

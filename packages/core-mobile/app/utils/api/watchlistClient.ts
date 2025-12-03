import {
  WatchlistMarketsResponse,
  SimplePriceResponse,
  TrendingToken
} from 'utils/api/types'
import { proxyApi } from './clients/proxyApiClient'

/**
 * OpenAPI client interface for watchlist endpoints
 * This allows any openapi-fetch client with the correct schema to be injected
 */
export type WatchlistHttpClient = typeof proxyApi

/**
 * High-level client interface for watchlist operations
 * Abstracts away HTTP details and provides typed domain methods
 */
export type WatchListClient = {
  getV1watchlistmarkets: (currency: string) => Promise<WatchlistMarketsResponse>
  getPrices: (params?: Record<string, never>) => Promise<SimplePriceResponse>
  getTrendingTokens: (
    params?: Record<string, never>
  ) => Promise<TrendingToken[]>
}

/**
 * Factory function to create a WatchListClient with dependency injection
 * @param httpClient - OpenAPI client instance (proxyApi, aggregatedTokensApi, or mock)
 * @returns WatchListClient with bound HTTP client
 *
 * @example
 * // Production usage with proxy API
 * const client = createWatchListClient(proxyApi)
 *
 * @example
 * // Testing with mock client
 * const mockClient = createClient<paths>({ baseUrl: 'http://mock' })
 * const client = createWatchListClient(mockClient)
 */
export const createWatchListClient = (
  httpClient: WatchlistHttpClient
): WatchListClient => {
  const getV1watchlistmarkets = async (
    currency: string
  ): Promise<WatchlistMarketsResponse> => {
    const { data, error } = await httpClient.GET('/v1/watchlist/markets', {
      params: {
        query: {
          currency,
          topMarkets: true
        }
      }
    })

    if (error) {
      throw error
    }

    return data
  }

  const getPrices = async (
    params?: Record<string, never>
  ): Promise<SimplePriceResponse> => {
    const { data, error } = await httpClient.GET('/v1/watchlist/price', {
      params
    })

    if (error) {
      throw error
    }

    return data
  }

  const getTrendingTokens = async (
    params?: Record<string, never>
  ): Promise<TrendingToken[]> => {
    const { data, error } = await httpClient.GET('/v1/watchlist/trending', {
      params
    })

    if (error) {
      throw error
    }

    return data
  }

  return {
    getV1watchlistmarkets,
    getPrices,
    getTrendingTokens
  }
}

/**
 * Default watchlist client instance using proxyApi
 * Use this for production code when you don't need custom configuration
 */
export const watchListClient: WatchListClient = createWatchListClient(proxyApi)

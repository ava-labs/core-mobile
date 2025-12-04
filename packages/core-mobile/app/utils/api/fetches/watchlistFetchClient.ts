import {
  AggregatedApiHttpClient as HttpClient,
  SimplePriceResponse,
  TrendingToken
} from 'utils/api/types'
import { proxyApi } from '../clients/proxyApiClient'

/**
 * High-level client interface for watchlist operations
 * Abstracts away HTTP details and provides typed domain methods
 */
export type WatchListClient = {
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
  httpClient: HttpClient
): WatchListClient => {
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
    getPrices,
    getTrendingTokens
  }
}

/**
 * Default watchlist client instance using proxyApi
 * Use this for production code when you don't need custom configuration
 */
export const watchListClient: WatchListClient = createWatchListClient(proxyApi)

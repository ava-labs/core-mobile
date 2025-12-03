import {
  AggregatedApiHttpClient as HttpClient,
  WatchlistMarketsResponse
} from 'utils/api/types'
import { tokenAggregatorApi } from '../clients/aggregatedTokensApiClient'
/**
 * High-level client interface for watchlist operations
 * Abstracts away HTTP details and provides typed domain methods
 */
export type AggregatedApiClient = {
  getV1watchlistmarkets: (currency: string) => Promise<WatchlistMarketsResponse>
}

/**
 * Factory function to create a WatchListClient with dependency injection
 * @param httpClient - OpenAPI client instance (proxyApi, aggregatedTokensApi, or mock)
 * @returns WatchListClient with bound HTTP client

 * @example
 * // Testing with mock client
 * const mockClient = createClient<paths>({ baseUrl: 'http://mock' })
 * const client = createWatchListClient(mockClient)
 */
export const createAggregatedApiClient = (
  httpClient: HttpClient
): AggregatedApiClient => {
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

  return {
    getV1watchlistmarkets
  }
}

/**
 * Default aggregated API client instance using tokenAggregatorApi
 * Use this for production code when you don't need custom configuration
 */
export const aggregatedApiClient: AggregatedApiClient =
  createAggregatedApiClient(tokenAggregatorApi)

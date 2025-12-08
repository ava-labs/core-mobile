import { SimplePriceResponse, TrendingToken } from 'utils/api/types'
import Config from 'react-native-config'
import { nitroGET } from '../clients/nitroFetchClient'
import { WatchListClient } from './watchlistFetchClient'

export const createNitroWatchListClient = (
  baseUrl: string
): WatchListClient => {
  const getPrices = async (
    params?: Record<string, never>
  ): Promise<SimplePriceResponse> => {
    return await nitroGET<SimplePriceResponse>(
      baseUrl + '/watchlist/price',
      params,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }

  const getTrendingTokens = async (
    params?: Record<string, never>
  ): Promise<TrendingToken[]> => {
    return await nitroGET<TrendingToken[]>(
      baseUrl + '/watchlist/trending',
      params,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
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
export const watchListClient: WatchListClient = createNitroWatchListClient(
  Config.PROXY_URL || ''
)

import { fetchWithNitro } from 'avalabs-nitro-fetch'
import Config from 'react-native-config'
import createClient, { Middleware } from 'openapi-fetch'
import queryString from 'query-string'
import { CORE_HEADERS } from 'utils/network/constants'
import AppCheckService from 'services/fcm/AppCheckService'
import type { paths } from '../../generated/api/tokenAggregator/schema'

export const GLACIER_URL = Config.GLACIER_URL

export type WatchlistMarketsResponse =
  paths['/v1/watchlist/markets']['get']['responses'][200]['content']['application/json']

export type WatchlistMarket = WatchlistMarketsResponse[number]

export const tokenAggregatorApi = createClient<paths>({
  baseUrl: Config.TOKEN_AGGREGATOR_URL,
  fetch: r => fetchWithNitro(r),
  headers: CORE_HEADERS,
  querySerializer: params =>
    queryString.stringify(params, { arrayFormat: 'comma' })
})

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const appCheckToken = await AppCheckService.getToken()
    request.headers.set('X-Firebase-AppCheck', appCheckToken.token)
    return request
  }
}

tokenAggregatorApi.use(authMiddleware)

export const getV1watchlistmarkets = async (
  currency: string
): Promise<WatchlistMarketsResponse> => {
  const { data, error } = await tokenAggregatorApi.GET(
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

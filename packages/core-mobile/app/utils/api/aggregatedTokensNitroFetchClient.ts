import { fetchWithNitro } from 'avalabs-nitro-fetch'
import Config from 'react-native-config'
import createClient, { Middleware } from 'openapi-fetch'
import queryString from 'query-string'
import { CORE_HEADERS } from 'utils/network/constants'
import AppCheckService from 'services/fcm/AppCheckService'
import Logger from 'utils/Logger'
import type { paths } from '../../generated/api/tokenAggregator/schema'

export const GLACIER_URL = Config.GLACIER_URL

if (!Config.PROXY_URL)
  Logger.warn('PROXY_URL is missing in env file. Watchlist is disabled.')

export type WatchlistMarketsResponse =
  paths['/v1/watchlist/markets']['get']['responses'][200]['content']['application/json']
export type SimplePriceResponse =
  paths['/v1/watchlist/price']['get']['responses'][200]['content']['application/json']
export type WatchlistMarket = WatchlistMarketsResponse[number]
export type TrendingToken =
  paths['/v1/watchlist/trending']['get']['responses'][200]['content']['application/json'][number]

export const tokenAggregatorApi = createClient<paths>({
  baseUrl: Config.TOKEN_AGGREGATOR_URL,
  fetch: r => fetchWithNitro(r),
  headers: CORE_HEADERS,
  querySerializer: params =>
    queryString.stringify(params, { arrayFormat: 'comma' })
})

export const proxyApi = createClient<paths>({
  baseUrl: Config.PROXY_URL,
  fetch: r => fetchWithNitro(r),
  headers: CORE_HEADERS,
  querySerializer: params =>
    queryString.stringify(params, { arrayFormat: 'comma' })
})

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    // eslint-disable-next-line no-console
    console.log(
      '🚀 ~ file: aggregatedTokensNitroFetchClient.ts:41 ~ request:',
      request
    )
    const appCheckToken = await AppCheckService.getToken()
    request.headers.set('X-Firebase-AppCheck', appCheckToken.token)
    return request
  }
}

tokenAggregatorApi.use(authMiddleware)
proxyApi.use(authMiddleware)

export const getV1watchlistmarketsV2 = async (
  currency: string
): Promise<WatchlistMarketsResponse> => {
  // eslint-disable-next-line no-console
  console.log(
    '🚀 ~ file: aggregatedTokensNitroFetchClient.ts:36 ~ currency:',
    currency
  )
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

export const getPrices = async (
  params?: Record<string, never>
): Promise<SimplePriceResponse> => {
  const { data, error } = await proxyApi.GET('/v1/watchlist/price', {
    params
  })

  // eslint-disable-next-line no-console
  console.log('🚀 ~ file: aggregatedTokensNitroFetchClient.ts:65 ~ data:', data)

  if (error) {
    // eslint-disable-next-line no-console
    console.log(
      '🚀 ~ file: aggregatedTokensNitroFetchClient.ts:69 ~ error:',
      error
    )
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

  // eslint-disable-next-line no-console
  console.log('🚀 ~ file: aggregatedTokensNitroFetchClient.ts:87 ~ data:', data)

  if (error) {
    // eslint-disable-next-line no-console
    console.log(
      '🚀 ~ file: aggregatedTokensNitroFetchClient.ts:87 ~ error:',
      error
    )
    throw error
  }

  return data
}

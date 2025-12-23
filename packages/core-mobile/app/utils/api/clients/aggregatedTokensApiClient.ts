import { fetch as nitroFetch } from 'react-native-nitro-fetch'
import Config from 'react-native-config'
import queryString from 'query-string'
import { CORE_HEADERS } from 'utils/apiClient/constants'
import Logger from 'utils/Logger'
import { appCheckMiddleware } from '../common/middlewares'
import { createClient } from '../generated/tokenAggregator/aggregatorApi.client/client/client.gen'

if (!Config.TOKEN_AGGREGATOR_URL)
  Logger.warn(
    'TOKEN_AGGREGATOR_URL is missing in env file. Watchlist will not work properly.'
  )

const tokenAggregatorApi = createClient({
  baseUrl: Config.TOKEN_AGGREGATOR_URL,
  headers: CORE_HEADERS,
  throwOnError: true,
  fetch: nitroFetch as typeof fetch,
  querySerializer: params =>
    queryString.stringify(params, { arrayFormat: 'comma' })
})

tokenAggregatorApi.interceptors.request.use(appCheckMiddleware)

export { tokenAggregatorApi }

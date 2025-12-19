import { fetch as nitroFetch } from 'react-native-nitro-fetch'
import Config from 'react-native-config'
import queryString from 'query-string'
import { CORE_HEADERS } from 'utils/apiClient/constants'
import createClient from 'openapi-fetch'
import Logger from 'utils/Logger'
import { appCheckMiddleware } from '../common/middlewares'
import { paths } from '../generated/tokenAggregator/schema'

if (!Config.TOKEN_AGGREGATOR_URL)
  Logger.warn(
    'TOKEN_AGGREGATOR_URL is missing in env file. Watchlist will not work properly.'
  )

export const tokenAggregatorApi = createClient<paths>({
  baseUrl: Config.TOKEN_AGGREGATOR_URL,
  fetch: nitroFetch,
  headers: CORE_HEADERS,
  querySerializer: params =>
    queryString.stringify(params, { arrayFormat: 'comma' })
})

tokenAggregatorApi.use(appCheckMiddleware)

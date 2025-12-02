import { fetch as nitroFetch } from 'react-native-nitro-fetch'
import Config from 'react-native-config'
import queryString from 'query-string'
import { CORE_HEADERS } from 'utils/apiClient/constants'
import createClient from 'openapi-fetch'
import { appCheckMiddleware } from '../middlewares'
import { paths } from '../generated/tokenAggregator/schema'
import Logger from 'utils/Logger'


if (!Config.PROXY_URL)
  Logger.warn('PROXY_URL is missing in env file. Watchlist will not work properly.')

export const proxyApi = createClient<paths>({
  baseUrl: Config.PROXY_URL,
  fetch: r => nitroFetch(r),
  headers: CORE_HEADERS,
  querySerializer: params =>
    queryString.stringify(params, { arrayFormat: 'comma' })
})

proxyApi.use(appCheckMiddleware)
import { fetch as nitroFetch } from 'react-native-nitro-fetch'
import Config from 'react-native-config'
import queryString from 'query-string'
import { CORE_HEADERS } from 'utils/apiClient/constants'
import createClient from 'openapi-fetch'
import Logger from 'utils/Logger'
import { appCheckMiddleware } from '../middlewares'
import { paths } from '../generated/glacier/schema'

if (!Config.GLACIER_URL)
  Logger.warn(
    'GLACIER_URL is missing in env file. Watchlist will not work properly.'
  )

export const glacierApi = createClient<paths>({
  baseUrl: Config.GLACIER_URL,
  fetch: r => nitroFetch(r),
  headers: CORE_HEADERS,
  querySerializer: params =>
    queryString.stringify(params, { arrayFormat: 'comma' })
})

glacierApi.use(appCheckMiddleware)

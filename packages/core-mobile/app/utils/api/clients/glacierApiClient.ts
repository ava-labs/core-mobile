import Config from 'react-native-config'
import queryString from 'query-string'
import Logger from 'utils/Logger'
import { createClient } from 'utils/api/generated/glacier/glacierApi.client/client'
import { appCheckFetch } from '../common/appCheckFetch'
import { CORE_HEADERS } from '../constants'

if (!Config.GLACIER_URL)
  Logger.warn(
    'GLACIER_URL is missing in env file. Watchlist will not work properly.'
  )

const glacierApiClient = createClient({
  baseUrl: Config.GLACIER_URL,
  headers: CORE_HEADERS,
  throwOnError: true,
  fetch: appCheckFetch as typeof fetch,
  querySerializer: params =>
    queryString.stringify(params, { arrayFormat: 'comma' })
})

export { glacierApiClient }

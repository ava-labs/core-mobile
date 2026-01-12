import Config from 'react-native-config'
import queryString from 'query-string'
import { CORE_HEADERS } from 'utils/apiClient/constants'
import Logger from 'utils/Logger'
import { createClient } from '../generated/tokenAggregator/aggregatorApi.client/client/client.gen'
import { appCheckFetch } from '../common/appCheckFetch'

if (!Config.TOKEN_AGGREGATOR_URL)
  Logger.warn(
    'TOKEN_AGGREGATOR_URL is missing in env file. Watchlist will not work properly.'
  )

const tokenAggregatorApi = createClient({
  baseUrl: Config.TOKEN_AGGREGATOR_URL,
  headers: CORE_HEADERS,
  throwOnError: true,
  fetch: appCheckFetch as typeof fetch,
  querySerializer: params =>
    queryString.stringify(params, { arrayFormat: 'comma' })
})

export { tokenAggregatorApi }

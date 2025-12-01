import Config from 'react-native-config'
import Logger from 'utils/Logger'
import queryString from 'query-string'
import AppCheckService from 'services/fcm/AppCheckService'
import {
  createApiClient,
  api as noOpApiClient
} from './generated/tokenAggregatorApi.client'
import { CORE_HEADERS } from './constants'

if (!Config.TOKEN_AGGREGATOR_URL)
  Logger.warn('TOKEN_AGGREGATOR_URL ENV is missing')

export const TOKEN_AGGREGATOR_URL = Config.TOKEN_AGGREGATOR_URL

let tokenAggregatorApi: ReturnType<typeof createApiClient>

if (TOKEN_AGGREGATOR_URL) {
  tokenAggregatorApi = createApiClient(TOKEN_AGGREGATOR_URL, {
    axiosConfig: {
      headers: CORE_HEADERS,
      // Use query-string's stringify with arrayFormat 'comma'
      // so that array parameters are serialized as comma-separated values,
      // e.g. txTypes=AddPermissionlessDelegatorTx,AddDelegatorTx,
      // instead of the default repeated keys (txTypes[]=...).
      paramsSerializer: params =>
        queryString.stringify(params, { arrayFormat: 'comma' })
    },
    validate: __DEV__
  })

  tokenAggregatorApi.axios.interceptors.request.use(async config => {
    const appCheckToken = await AppCheckService.getToken()
    config.headers['X-Firebase-AppCheck'] = appCheckToken.token
    return config
  })
} else {
  tokenAggregatorApi = noOpApiClient
}

export { tokenAggregatorApi }

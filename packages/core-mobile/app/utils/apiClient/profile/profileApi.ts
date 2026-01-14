import Config from 'react-native-config'
import Logger from 'utils/Logger'
import queryString from 'query-string'
import AppCheckService from 'services/fcm/AppCheckService'
import {
  createApiClient,
  api as noOpApiClient
} from '../generated/profileApi.client'
import { CORE_HEADERS } from '../constants'

if (!Config.CORE_PROFILE_URL) Logger.warn('CORE_PROFILE_URL ENV is missing')

export const CORE_PROFILE_URL = Config.CORE_PROFILE_URL

let profileApi: ReturnType<typeof createApiClient>

if (CORE_PROFILE_URL) {
  profileApi = createApiClient(CORE_PROFILE_URL, {
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

  profileApi.axios.interceptors.request.use(async config => {
    const appCheckToken = await AppCheckService.getToken()
    config.headers['X-Firebase-AppCheck'] = appCheckToken.token
    return config
  })

  profileApi.axios.interceptors.response.use(
    response => response,
    async error => {
      const originalRequest = error.config
      if (
        (error.response?.status === 401 || error.response?.status === 403) &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true
        Logger.warn(
          'AppCheck token rejected (profileApi), retrying with fresh token'
        )
        const { token } = await AppCheckService.getToken(true)
        originalRequest.headers['X-Firebase-AppCheck'] = token
        return profileApi.axios(originalRequest)
      }
      return Promise.reject(error)
    }
  )
} else {
  profileApi = noOpApiClient
}

export { profileApi }

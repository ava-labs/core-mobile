import Config from 'react-native-config'
import Logger from 'utils/Logger'
import queryString from 'query-string'
import { createApiClient, api as noOpApiClient } from './glacierApi.client'
import { CORE_HEADERS } from './constants'

if (!Config.GLACIER_URL) Logger.warn('GLACIER_URL ENV is missing')

export const GLACIER_URL = Config.GLACIER_URL

// RPC urls returned in the token list are always using the production URL
const knownHosts = ['glacier-api.avax.network', 'proxy-api.avax.network']

/**
 * Glacier needs an API key for development, this adds the key if needed.
 */
export function addGlacierAPIKeyIfNeeded(url: string): string {
  const urlObj = new URL(url)

  if (Config.GLACIER_API_KEY && knownHosts.includes(urlObj.hostname)) {
    const search_params = urlObj.searchParams // copy, does not update the URL
    search_params.set('token', Config.GLACIER_API_KEY)
    urlObj.search = search_params.toString()
    return urlObj.toString()
  }

  return url
}

export const glacierApi = GLACIER_URL
  ? createApiClient(GLACIER_URL, {
      axiosConfig: {
        headers: CORE_HEADERS,
        params: {
          // bypass ratelimit in development/e2e
          rltoken: Config.GLACIER_API_KEY
        },
        // Use query-string's stringify with arrayFormat 'comma'
        // so that array parameters are serialized as comma-separated values,
        // e.g. txTypes=AddPermissionlessDelegatorTx,AddDelegatorTx,
        // instead of the default repeated keys (txTypes[]=...).
        paramsSerializer: params =>
          queryString.stringify(params, { arrayFormat: 'comma' })
      }
    })
  : noOpApiClient

import { Glacier } from '@avalabs/glacier-sdk'
import Config from 'react-native-config'
import { createApiClient } from './glacierApi.client'

if (!Config.GLACIER_URL) throw Error('GLACIER_URL ENV is missing')

export const GLACIER_URL = Config.GLACIER_URL

export const glacierSdk = new Glacier({ BASE: Config.GLACIER_URL })

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

export const glacierApi = createApiClient(GLACIER_URL)

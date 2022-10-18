import Config from 'react-native-config'
import Logger from './Logger'

if (!Config.GLACIER_URL || !Config.GLACIER_API_KEY)
  Logger.error('GLACIER_URL or GLACIER_API_KEY env is missing')

export const GLACIER_URL = Config.GLACIER_URL

/**
 * Glacier needs an API key for development, this adds the key if needed.
 */
export function addGlacierAPIKeyIfNeeded(url: string): string {
  if (url.startsWith(Config.GLACIER_URL) && Config.GLACIER_API_KEY) {
    const urlObj = new URL(url)
    const search_params = urlObj.searchParams // copy, does not update the URL
    search_params.set('token', Config.GLACIER_API_KEY)
    urlObj.search = search_params.toString()
    return urlObj.toString()
  }

  return url
}

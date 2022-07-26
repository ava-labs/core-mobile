import Config from 'react-native-config'

/**
 * After constructing a full URL make sure to call `addGlacierAPIKeyIfNeeded`.
 */
export const GLACIER_URL = __DEV__
  ? Config.GLACIER_DEV_URL
  : Config.GLACIER_PROD_URL

/**
 * Glacier needs an API key for development, this adds the key if needed.
 */
export function addGlacierAPIKeyIfNeeded(url: string): string {
  if (Config.GLACIER_API_KEY && url.startsWith(GLACIER_URL)) {
    const urlObj = new URL(url)
    const search_params = urlObj.searchParams // copy, does not update the URL
    search_params.set('token', Config.GLACIER_API_KEY)
    urlObj.search = search_params.toString()
    return urlObj.toString()
  }

  return url
}

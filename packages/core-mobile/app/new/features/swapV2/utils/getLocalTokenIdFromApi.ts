import { ApiToken } from '../types'

/**
 * Creates a localId for an API token to match with balance data.
 * - NATIVE tokens: "NATIVE-{symbol}"
 * - Others: address (lowercase for case-insensitive comparison)
 */
export const getLocalTokenIdFromApi = (apiToken: ApiToken): string => {
  return apiToken.isNative
    ? `NATIVE-${apiToken.symbol}`
    : apiToken.address.toLowerCase()
}

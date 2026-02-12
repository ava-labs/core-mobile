import Config from 'react-native-config'
import { appCheckFetch } from '../common/appCheckFetch'
import { CORE_HEADERS } from '../constants'
import { createClient } from '../generated/profileApi.client/client'

/**
 * Profile API client configured with:
 * - nitroFetch (via appCheckFetch) for better performance
 * - AppCheck authentication with automatic retry
 * - Core headers
 */
export const profileApiClient = createClient({
  baseUrl: Config.CORE_PROFILE_URL,
  fetch: appCheckFetch as typeof fetch,
  headers: CORE_HEADERS
})

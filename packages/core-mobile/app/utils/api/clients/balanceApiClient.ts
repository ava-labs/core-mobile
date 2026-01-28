import Config from 'react-native-config'
import { appCheckFetch } from 'utils/api/common/appCheckFetch'
import { CORE_HEADERS } from '../../apiClient/constants'
import { createClient } from '../../apiClient/generated/balanceApi.client/client'

/**
 * Balance API client configured with:
 * - nitroFetch (via appCheckFetch) for better performance
 * - AppCheck authentication with automatic retry
 * - Core headers
 *
 * Use this client for non-streaming balance API requests.
 * For streaming (get-balances), use balanceApi.getBalancesStream instead.
 */
export const balanceApiClient = createClient({
  baseUrl: Config.BALANCE_URL,
  fetch: appCheckFetch as typeof fetch,
  headers: CORE_HEADERS
})

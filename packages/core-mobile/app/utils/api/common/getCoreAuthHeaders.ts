import Config from 'react-native-config'
import AppCheckService from 'services/fcm/AppCheckService'

const APPCHECK_HEADER = 'X-Firebase-AppCheck'
const CORE_API_KEY_HEADER = 'x-core-api-key'

/**
 * Resolves the auth headers required by core-proxy-api (e.g. the Glacier
 * proxy): a Firebase AppCheck token, plus the Core API key when one is
 * configured (dev/E2E builds — it both authorizes and bypasses rate limits).
 *
 * Meant to be invoked per request (e.g. as a glacier-sdk HEADERS resolver or
 * the vm-modules `runtime.getAuthHeaders`) so the short-lived AppCheck token
 * is re-read on every call. Unlike appCheckFetch, callers of this resolver
 * get no 401-retry-with-fresh-token — the token cache makes that rare.
 */
export const getCoreAuthHeaders = async (): Promise<Record<string, string>> => {
  const { token } = await AppCheckService.getToken()
  return {
    [APPCHECK_HEADER]: token,
    ...(Config.CORE_API_KEY
      ? { [CORE_API_KEY_HEADER]: Config.CORE_API_KEY }
      : {})
  }
}

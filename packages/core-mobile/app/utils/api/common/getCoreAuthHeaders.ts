import AppCheckService from 'services/fcm/AppCheckService'
import { APPCHECK_HEADER } from 'utils/api/common/appCheckFetch'

/**
 * Resolves the auth headers required by core-proxy-api (e.g. the Glacier
 * proxy): a Firebase AppCheck token.
 *
 * The proxy authorizes on the AppCheck token alone. We intentionally do NOT
 * send an `x-core-api-key` — the proxy rejects a request that carries an
 * invalid/legacy key with a 401 even when a valid AppCheck token is present,
 * so attaching the (now-defunct) Glacier key breaks every Glacier call.
 *
 * Meant to be invoked per request (e.g. as a glacier-sdk HEADERS resolver or
 * the vm-modules `runtime.getAuthHeaders`) so the short-lived AppCheck token
 * is re-read on every call. Unlike appCheckFetch, callers of this resolver
 * get no 401-retry-with-fresh-token — the token cache makes that rare.
 */
export const getCoreAuthHeaders = async (): Promise<Record<string, string>> => {
  const { token } = await AppCheckService.getToken()
  return {
    [APPCHECK_HEADER]: token
  }
}

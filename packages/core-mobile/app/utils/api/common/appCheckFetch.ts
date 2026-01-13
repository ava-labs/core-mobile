import { fetch as nitroFetch } from 'react-native-nitro-fetch'
import { fetch as expoFetch } from 'expo/fetch'
import AppCheckService from 'services/fcm/AppCheckService'
import Logger from 'utils/Logger'

const APPCHECK_HEADER = 'X-Firebase-AppCheck'

const shouldRetry = (status: number): boolean =>
  status === 401 || status === 403

/**
 * App Check fetch for Request objects (used by @hey-api/openapi-ts client).
 * Includes retry logic for invalid tokens (401/403).
 */
const appCheckRequestFetch = async (request: Request): Promise<Response> => {
  const { token } = await AppCheckService.getToken()
  const headers = new Headers(request.headers)
  headers.set(APPCHECK_HEADER, token)

  const response = await nitroFetch(new Request(request, { headers }))

  if (!shouldRetry(response.status)) {
    return response
  }

  Logger.warn('AppCheck token rejected, retrying with fresh token')
  const { token: freshToken } = await AppCheckService.getToken(true)
  headers.set(APPCHECK_HEADER, freshToken)

  return nitroFetch(new Request(request, { headers }))
}

/**
 * App Check fetch for URL/string inputs.
 * Includes retry logic for invalid tokens (401/403).
 */
const appCheckUrlFetch = async (
  url: string | URL,
  init?: RequestInit
): Promise<Response> => {
  const { token } = await AppCheckService.getToken()
  const headers = new Headers(init?.headers)
  headers.set(APPCHECK_HEADER, token)

  const response = await nitroFetch(url, { ...init, headers })

  if (!shouldRetry(response.status)) {
    return response
  }

  Logger.warn('AppCheck token rejected, retrying with fresh token')
  const { token: freshToken } = await AppCheckService.getToken(true)
  headers.set(APPCHECK_HEADER, freshToken)

  return nitroFetch(url, { ...init, headers })
}

/**
 * App Check fetch using nitroFetch.
 * Includes retry logic for invalid tokens (401/403).
 * Does NOT support streaming.
 *
 * Handles both fetch(url, init) and fetch(Request) call patterns.
 */
export const appCheckFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  if (input instanceof Request) {
    return appCheckRequestFetch(input)
  }
  return appCheckUrlFetch(input, init)
}

/**
 * App Check fetch with streaming support.
 * Uses expo/fetch which supports ReadableStream for response.body.
 * Includes retry logic for invalid tokens (401/403).
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const appCheckStreamingFetch = async (
  url: string,
  init?: RequestInit
) => {
  const { token } = await AppCheckService.getToken()
  const headers = new Headers(init?.headers)
  headers.set(APPCHECK_HEADER, token)

  const fetchOptions = {
    method: init?.method,
    headers,
    body: init?.body ?? undefined,
    signal: init?.signal ?? undefined
  }

  const response = await expoFetch(url, fetchOptions)

  if (!shouldRetry(response.status)) {
    return response
  }

  Logger.warn('AppCheck token rejected (streaming), retrying with fresh token')
  const { token: freshToken } = await AppCheckService.getToken(true)
  headers.set(APPCHECK_HEADER, freshToken)

  return expoFetch(url, fetchOptions)
}

export const appCheckPostJson = async (
  url: string,
  bodyJson: string
): Promise<Response> => {
  return appCheckFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: bodyJson
  })
}

import { fetch as nitroFetch } from 'react-native-nitro-fetch'
import { fetch as expoFetch } from 'expo/fetch'
import AppCheckService from 'services/fcm/AppCheckService'
import Logger from 'utils/Logger'

/**
 * App Check fetch using nitroFetch.
 * Includes retry logic for invalid tokens.
 * Does NOT support streaming.
 */
const createAppCheckFetch = () => {
  return async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const { token } = await AppCheckService.getToken()
    const headers = new Headers(init?.headers)
    headers.set('X-Firebase-AppCheck', token)

    const response = await nitroFetch(input, { ...init, headers })

    // Only retry on 401/403 (likely App Check token issues)
    if (response.status !== 401 && response.status !== 403) {
      return response
    }

    Logger.warn('AppCheck token rejected, retrying with fresh token')
    const { token: freshToken } = await AppCheckService.getToken(true)
    headers.set('X-Firebase-AppCheck', freshToken)

    return nitroFetch(input, { ...init, headers })
  }
}

/**
 * App Check fetch with streaming support.
 * Uses expo/fetch which supports ReadableStream for response.body.
 * Includes retry logic for invalid tokens.
 */
const createAppCheckStreamingFetch = () => {
  return async (url: string, init?: RequestInit) => {
    const { token } = await AppCheckService.getToken()
    const headers = new Headers(init?.headers)
    headers.set('X-Firebase-AppCheck', token)

    const fetchOptions = {
      method: init?.method,
      headers,
      body: init?.body ?? undefined,
      signal: init?.signal ?? undefined
    }

    const response = await expoFetch(url, fetchOptions)

    // Only retry on 401/403 (likely App Check token issues)
    if (response.status !== 401 && response.status !== 403) {
      return response
    }

    Logger.warn(
      'AppCheck token rejected (streaming), retrying with fresh token'
    )
    const { token: freshToken } = await AppCheckService.getToken(true)
    headers.set('X-Firebase-AppCheck', freshToken)

    return expoFetch(url, fetchOptions)
  }
}

export const appCheckFetch = createAppCheckFetch()
export const appCheckStreamingFetch = createAppCheckStreamingFetch()

import { fetch as nitroFetch } from 'react-native-nitro-fetch'
import { fetch as expoFetch } from 'expo/fetch'
import AppCheckService from 'services/fcm/AppCheckService'
import Logger from 'utils/Logger'

const APPCHECK_HEADER = 'X-Firebase-AppCheck'

const shouldRetry = (status: number): boolean =>
  status === 401 || status === 403

/**
 * Normalize fetch inputs to a plain url + RequestInit pair.
 *
 * nitroFetch ignores the body stored inside a Request object — it only reads
 * body from the RequestInit argument. We therefore extract every relevant field
 * explicitly. request.body may be null in some React Native fetch implementations
 * even when a body was provided, so we always read via request.text() to be safe.
 */
const toUrlAndInit = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ url: string; requestInit: RequestInit }> => {
  if (!(input instanceof Request)) {
    return {
      url: input instanceof URL ? input.href : input,
      requestInit: init ?? {}
    }
  }

  let bodyText: string | undefined
  try {
    bodyText = (await input.text()) || undefined
  } catch (e) {
    Logger.warn('appCheckFetch: failed to read request body', e)
  }

  return {
    url: input.url,
    requestInit: {
      method: input.method,
      headers: input.headers,
      body: bodyText,
      signal: input.signal,
      credentials: input.credentials,
      redirect: input.redirect,
      cache: input.cache,
      keepalive: input.keepalive,
      ...init
    }
  }
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
  const { url, requestInit } = await toUrlAndInit(input, init)

  const { token } = await AppCheckService.getToken()
  const headers = new Headers(requestInit.headers)
  headers.set(APPCHECK_HEADER, token)

  const response = await nitroFetch(url, { ...requestInit, headers })

  if (!shouldRetry(response.status)) {
    return response
  }

  Logger.warn('AppCheck token rejected, retrying with fresh token')
  const { token: freshToken } = await AppCheckService.getToken(true)
  headers.set(APPCHECK_HEADER, freshToken)

  return nitroFetch(url, { ...requestInit, headers })
}

/**
 * App Check fetch with streaming support.
 * Uses expo/fetch which supports ReadableStream for response.body.
 * No retry — streaming responses are always consumed and non-replayable.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const appCheckStreamingFetch = async (
  url: string,
  init?: RequestInit
) => {
  const { token } = await AppCheckService.getToken()
  const headers = new Headers(init?.headers)
  headers.set(APPCHECK_HEADER, token)

  return expoFetch(url, {
    method: init?.method,
    headers,
    body: init?.body ?? undefined,
    signal: init?.signal ?? undefined
  })
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

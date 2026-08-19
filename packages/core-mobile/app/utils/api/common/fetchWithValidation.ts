import { fetch as nitroFetch } from 'react-native-nitro-fetch'
import { fetch as expoFetch } from 'expo/fetch'
import { z } from 'zod'

/**
 * Error thrown on a non-2xx response. Carries the parsed response body under
 * `response.data` so callers (e.g. Meld's `getErrorMessage`) can read the
 * server's error code/message instead of only the HTTP status line.
 */
export type HttpError = Error & {
  response?: { status: number; statusText?: string; data?: unknown }
}

const buildHttpError = async (response: {
  status: number
  statusText: string
  json: () => Promise<unknown>
}): Promise<HttpError> => {
  let data: unknown
  try {
    data = await response.json()
  } catch {
    // body was empty or not JSON — fall back to the status line only
  }
  const error: HttpError = new Error(
    `HTTP ${response.status}: ${response.statusText}`
  )
  error.response = {
    status: response.status,
    statusText: response.statusText,
    data
  }
  return error
}

/**
 * Fetch helper with optional dev-only Zod validation.
 * Uses nitroFetch by default for better performance.
 */
export const fetchJson = async <T>(
  url: string,
  options?: RequestInit,
  schema?: z.ZodType<T>
): Promise<T> => {
  const response = await nitroFetch(
    url,
    options as Parameters<typeof nitroFetch>[1]
  )

  if (!response.ok) {
    throw await buildHttpError(response)
  }

  const data = await response.json()

  // Validate with Zod ONLY in development
  if (__DEV__ && schema) {
    return schema.parse(data)
  }

  return data
}

/**
 * Fetch helper with expo fetch (supports streaming).
 * Use this for endpoints that need ReadableStream support.
 */
export const fetchJsonWithExpo = async <T>(
  url: string,
  options?: RequestInit,
  schema?: z.ZodType<T>
): Promise<T> => {
  const response = await expoFetch(
    url,
    options as Parameters<typeof expoFetch>[1]
  )

  if (!response.ok) {
    throw await buildHttpError(response)
  }

  const data = await response.json()

  // Validate with Zod ONLY in development
  if (__DEV__ && schema) {
    return schema.parse(data)
  }

  return data
}

/**
 * Helper to build query string from params object.
 */
export const buildQueryString = (params: Record<string, unknown>): string => {
  const filtered = Object.entries(params).filter(([_, v]) => v !== undefined)
  if (filtered.length === 0) return ''

  const searchParams = new URLSearchParams()
  filtered.forEach(([key, value]) => {
    searchParams.append(key, String(value))
  })
  return `?${searchParams.toString()}`
}

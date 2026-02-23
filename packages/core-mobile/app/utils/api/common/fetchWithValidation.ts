import { fetch as nitroFetch } from 'react-native-nitro-fetch'
import { fetch as expoFetch } from 'expo/fetch'
import { z } from 'zod'

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
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
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
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
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

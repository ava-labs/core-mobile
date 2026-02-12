import Config from 'react-native-config'
import { appCheckFetch } from 'utils/api/common/appCheckFetch'
import Logger from 'utils/Logger'
import { appCheckStreamingFetch } from 'utils/api/common/appCheckFetch'
import { CORE_HEADERS } from '../constants'
import { createClient } from '../../api/generated/balanceApi.client/client'
import {
  GetBalancesRequestBody,
  GetBalancesResponse
} from '../generated/balanceApi.client/types.gen'

if (!Config.BALANCE_URL) Logger.warn('BALANCE_URL ENV is missing')

export const BALANCE_URL = Config.BALANCE_URL

const NEWLINE = '\n'

const isDev = typeof __DEV__ === 'boolean' && __DEV__

/**
 * Balance API client configured with:
 * - nitroFetch (via appCheckFetch) for better performance
 * - AppCheck authentication with automatic retry
 * - Core headers
 *
 * Use this client for non-streaming balance API requests.
 * For streaming (get-balances), use streamingBalanceApiClient.getBalances instead.
 */
export const balanceApiClient = createClient({
  baseUrl: Config.BALANCE_URL,
  fetch: appCheckFetch as typeof fetch,
  headers: CORE_HEADERS
})

export const streamingBalanceApiClient = {
  // eslint-disable-next-line sonarjs/cognitive-complexity
  getBalances: async function* (
    body: GetBalancesRequestBody
  ): AsyncGenerator<GetBalancesResponse> {
    const res = await appCheckStreamingFetch(
      `${BALANCE_URL}/v1/balance/get-balances`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...CORE_HEADERS
        },
        body: JSON.stringify(body)
      }
    )

    // Check if the response is successful
    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}: ${res.statusText}`
      try {
        // Try to read error body if available
        if (res.body) {
          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let errorBody = ''
          let done = false
          while (!done) {
            const { value, done: readerDone } = await reader.read()
            done = readerDone
            if (value) {
              errorBody += decoder.decode(value, { stream: true })
            }
          }
          reader.releaseLock()
          if (errorBody) {
            try {
              const errorJson = JSON.parse(errorBody)
              errorMessage =
                errorJson.message || errorJson.error || errorMessage
            } catch {
              errorMessage = errorBody
            }
          }
        }
      } catch (err) {
        Logger.warn('Failed to read error response body', err)
      }
      throw new Error(errorMessage)
    }

    if (!res.body) {
      throw new Error('Stream unavailable (response.body missing)')
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let done = false

    // do measurement in DEV only
    let startTime: number | undefined
    if (isDev) {
      startTime = Date.now()
      Logger.info('📡 Streaming balances…')
    }

    try {
      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone

        if (value) {
          buffer += decoder.decode(value, { stream: true })
        }

        // Process complete lines
        let newlineIndex = buffer.indexOf(NEWLINE)

        while (newlineIndex !== -1) {
          const rawLine = buffer.slice(0, newlineIndex).trim()
          buffer = buffer.slice(newlineIndex + 1)
          newlineIndex = buffer.indexOf(NEWLINE)

          if (!rawLine) continue

          // Remove "data: " prefix if present
          const jsonLine = rawLine.startsWith('data:')
            ? rawLine.slice(5).trim()
            : rawLine

          try {
            const parsed = JSON.parse(jsonLine) as GetBalancesResponse
            yield parsed
          } catch {
            // Ignore malformed lines
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    if (isDev && startTime) {
      const totalTime = Date.now() - startTime
      Logger.info(`✅ Stream finished in ${totalTime}ms`)
    }
  }
}

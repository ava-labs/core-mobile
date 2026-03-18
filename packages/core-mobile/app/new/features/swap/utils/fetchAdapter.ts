import { fetch as expoFetch } from 'expo/fetch'

/**
 * Fetch adapter that uses expo-fetch for all requests
 *
 * Strategy:
 * - Checks content-type to detect streaming responses
 * - For streaming responses (text/event-stream, application/stream):
 *   Returns expo-fetch response as-is
 *   Preserves the body stream for SSE
 *   The SDK reads .body directly (doesn't use .clone())
 * - For non-streaming responses (JSON, text):
 *   Reads body and creates standard Response
 *   Makes .clone() work for the SDK's _safeParseResponse
 */
export const fetchAdapter: typeof globalThis.fetch = async (input, init) => {
  // Convert RequestInfo | URL to string for expo-fetch
  let url: string
  if (input instanceof Request) {
    url = input.url
  } else if (input instanceof URL) {
    url = input.href
  } else if (typeof input === 'string') {
    // After checking Request and URL, input must be string
    url = input
  } else {
    throw new Error('Invalid input type')
  }

  // Use expo-fetch for the request
  // Convert RequestInit to FetchRequestInit (expo-fetch doesn't allow null values)
  const fetchInit = init
    ? {
        ...init,
        body: init.body === null ? undefined : init.body,
        signal: init.signal === null ? undefined : init.signal,
        window: init.window === null ? undefined : init.window
      }
    : undefined
  const response = await expoFetch(url, fetchInit)

  // Check content-type to determine if this is a streaming response
  const contentType = response.headers.get('content-type') || ''
  const isStreaming =
    contentType.includes('text/event-stream') ||
    contentType.includes('application/stream')

  if (isStreaming) {
    // For streaming: return expo-fetch response as-is (SDK reads .body directly)
    return response
  } else {
    // For non-streaming: read body and create standard Response to support .clone()
    const body = await response.text()
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    })
  }
}

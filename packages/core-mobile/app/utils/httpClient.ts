import { appCheckFetch } from './api/common/appCheckFetch'

/**
 * Convenience wrapper for POST requests with App Check token.
 * Uses appCheckFetch internally which includes retry logic for invalid tokens.
 */
export default async function fetchWithAppCheck(
  url: string,
  bodyJson: string
): Promise<Response> {
  return appCheckFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: bodyJson
  })
}

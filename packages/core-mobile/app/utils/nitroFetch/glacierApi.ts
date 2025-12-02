import Config from 'react-native-config'
import { fetchWithNitro } from 'avalabs-nitro-fetch'
import queryString from 'query-string'

export const glacierNitroFetchClient = async <T>(
  {
    url,
    method,
    params,
    data,
    headers
  }: {
    url: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    params?: unknown
    data?: unknown
    headers?: Record<string, string>
    responseType?: string
  },

  _options?: unknown
): Promise<T> => {
  let targetUrl = `${Config.GLACIER_URL}${url}`

  if (params) {
    const urlParams = queryString.stringify(params, { arrayFormat: 'comma' })
    // eslint-disable-next-line no-console
    console.log('🚀 ~ file: glacierApi.ts:27 ~ urlParams:', urlParams)
    targetUrl += '?' + urlParams
  }

  const request = new Request(targetUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: data ? JSON.stringify(data) : undefined
  })

  const response = await fetchWithNitro(request)

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result = await response.json()
  return result as T
}

export default glacierNitroFetchClient

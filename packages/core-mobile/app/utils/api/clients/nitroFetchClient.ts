import { fetch as nitroFetch } from 'react-native-nitro-fetch'
import queryString from 'query-string'

export const nitroGET = async <T>(
  url: string,
  params?: Record<string, never>,
  options?: RequestInit
): Promise<T> => {
  const queryStringParams = queryString.stringify(params || {}, {
    arrayFormat: 'comma'
  })
  const fullUrl = url + (queryStringParams ? '?' + queryStringParams : '')
  const response = await nitroFetch(fullUrl, options)
  return response.json()
}

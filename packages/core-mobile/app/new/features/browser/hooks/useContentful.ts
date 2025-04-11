import { Config } from 'react-native-config'
import Logger from 'utils/Logger'

const PROXY_ENDPOINT = `${Config.PROXY_URL}/proxy/contentful?`

export type GraphQLResponse<T> = {
  data: {
    [key: string]: {
      items: T[]
    }
  }
}

export type ParsedGraphQLResponse<T> = {
  items: T[]
}

export function getContentfulGraphQL(
  query: string,
  operationName: string,
  variables: Record<string, any>
): Request {
  try {
    return new Request(PROXY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        operationName,
        variables
      })
    })
  } catch (error) {
    Logger.error('Failed to fetch from Contentful GraphQL', error)
    throw new Error('Failed to fetch from Contentful GraphQL')
  }
}

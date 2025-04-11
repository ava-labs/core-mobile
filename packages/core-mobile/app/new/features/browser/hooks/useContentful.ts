import { Config } from 'react-native-config'
import Logger from 'utils/Logger'

const PROXY_ENDPOINT = `${Config.PROXY_URL}/proxy/contentful?`

export type ContentfulProject = {
  name: string
  description?: string
  website?: string
  logo?: {
    url: string
  }
}

export type ContentfulEcosystemProject = {
  name: string
  description?: string
  website?: string
  hideOnMobile?: boolean
  logo?: {
    url: string
  }
}

export type ContentfulEducationArticle = {
  headline: string
  url: string
}

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

export async function getContentfulGraphQL(
  query: string,
  operationName: string,
  variables: Record<string, any>
): Promise<Request> {
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

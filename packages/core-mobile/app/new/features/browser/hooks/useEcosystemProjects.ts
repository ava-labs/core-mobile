import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import Logger from 'utils/Logger'
import {
  getContentfulGraphQL,
  GraphQLResponse,
  ParsedGraphQLResponse
} from './useContentful'

const LIMIT = 40

export type ContentfulEcosystemProject = {
  name: string
  description?: string
  website?: string
  hideOnMobile?: boolean
  logo?: {
    url: string
  }
}

export function useEcosystemProjects(): UseQueryResult<
  ParsedGraphQLResponse<ContentfulEcosystemProject>,
  Error
> {
  return useQuery({
    queryKey: [ReactQueryKeys.ECOSYSTEM_PROJECTS],
    queryFn: fetchEcosystemProjects
  })
}

async function fetchEcosystemProjects(): Promise<
  ParsedGraphQLResponse<ContentfulEcosystemProject>
> {
  try {
    const request = getContentfulGraphQL(
      ECOSYSTEM_PROJECTS_QUERY,
      'ecosystemCarouselItem',
      { limit: LIMIT }
    )
    const response = await fetch(request)
    const graphqlData =
      (await response.json()) as GraphQLResponse<ContentfulEcosystemProject>

    if (graphqlData.data?.ecosystemCarouselItemCollection) {
      return {
        items: graphqlData.data.ecosystemCarouselItemCollection.items
      }
    }

    return {
      items: []
    }
  } catch (error) {
    Logger.error('Error fetching ecosystem projects', error)
    throw new Error('Error fetching ecosystem projects')
  }
}

const ECOSYSTEM_PROJECTS_QUERY = `
  query ecosystemCarouselItem($limit: Int!) {
    ecosystemCarouselItemCollection(limit: $limit) {
      items {
        name
        description
        website
        hideOnMobile
        logo {
          url
        }
      }
    }
  }
`

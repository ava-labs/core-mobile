import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
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
  const request = await getContentfulGraphQL(
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

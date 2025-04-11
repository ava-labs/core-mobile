import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import Logger from 'utils/Logger'
import {
  getContentfulGraphQL,
  GraphQLResponse,
  ParsedGraphQLResponse
} from './useContentful'

const LIMIT = 40

const INITIAL_DATA: ParsedGraphQLResponse<ContentfulFeaturedProject> = {
  items: []
}

export type ContentfulFeaturedProject = {
  name: string
  description?: string
  website?: string
  logo?: {
    url: string
  }
}

export function useFeaturedProjects(): UseQueryResult<
  ParsedGraphQLResponse<ContentfulFeaturedProject>,
  Error
> {
  return useQuery({
    queryKey: [ReactQueryKeys.FEATURED_PROJECTS],
    queryFn: fetchFeaturedProjects,
    initialData: INITIAL_DATA
  })
}

async function fetchFeaturedProjects(): Promise<
  ParsedGraphQLResponse<ContentfulFeaturedProject>
> {
  try {
    const request = getContentfulGraphQL(
      FEATURED_PROJECTS_QUERY,
      'featuredProjects',
      { limit: LIMIT }
    )
    const response = await fetch(request)
    const graphqlData =
      (await response.json()) as GraphQLResponse<ContentfulFeaturedProject>

    if (graphqlData.data?.projectCollection) {
      return {
        items: graphqlData.data.projectCollection.items
      }
    }

    return {
      items: []
    }
  } catch (error) {
    Logger.error('Error fetching featured projects', error)
    throw new Error('Error fetching featured projects')
  }
}

const FEATURED_PROJECTS_QUERY = `
  query featuredProjects($limit: Int!) {
    projectCollection(where: {OR: [{isFeatured: true}]}, limit: $limit) {
      items {
        name
        description
        website
        logo {
          url
        }
      }
    }
  }
`

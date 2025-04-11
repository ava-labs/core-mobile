import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import {
  ContentfulProject,
  getContentfulGraphQL,
  GraphQLResponse,
  ParsedGraphQLResponse
} from './useContentful'

const LIMIT = 40

const INITIAL_DATA: ParsedGraphQLResponse<ContentfulProject> = {
  items: []
}

export function useFeaturedProjects(): UseQueryResult<
  ParsedGraphQLResponse<ContentfulProject>,
  Error
> {
  return useQuery({
    queryKey: [ReactQueryKeys.FEATURED_PROJECTS],
    queryFn: fetchFeaturedProjects,
    initialData: INITIAL_DATA
  })
}

async function fetchFeaturedProjects(): Promise<
  ParsedGraphQLResponse<ContentfulProject>
> {
  const request = await getContentfulGraphQL(
    FEATURED_PROJECTS_QUERY,
    'featuredProjects',
    { limit: LIMIT }
  )
  const response = await fetch(request)
  const graphqlData =
    (await response.json()) as GraphQLResponse<ContentfulProject>

  if (graphqlData.data?.projectCollection) {
    return {
      items: graphqlData.data.projectCollection.items
    }
  }

  return {
    items: []
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

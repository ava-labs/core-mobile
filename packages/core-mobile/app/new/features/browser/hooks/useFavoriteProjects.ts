import { useQuery, UseQueryResult } from '@tanstack/react-query'
import {
  GraphQLResponse,
  ParsedGraphQLResponse,
  getContentfulGraphQL
} from 'common/hooks/useContentful'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import Logger from 'utils/Logger'

const LIMIT = 40

export type ContentfulFavoriteProject = {
  name: string
  website?: string
  logo?: {
    url: string
  }
}

export function useFavoriteProjects(): UseQueryResult<
  ParsedGraphQLResponse<ContentfulFavoriteProject>,
  Error
> {
  return useQuery({
    queryKey: [ReactQueryKeys.FAVORITE_PROJECTS],
    queryFn: fetchFavoriteProjects
  })
}

async function fetchFavoriteProjects(): Promise<
  ParsedGraphQLResponse<ContentfulFavoriteProject>
> {
  try {
    const request = getContentfulGraphQL(
      FAVORITE_PROJECTS_QUERY,
      'featuredProjects',
      { limit: LIMIT }
    )

    const response = await fetch(request)
    const graphqlData =
      (await response.json()) as GraphQLResponse<ContentfulFavoriteProject>
    if (graphqlData.data?.projectCollection) {
      return {
        items: graphqlData.data.projectCollection.items
      }
    }

    return {
      items: []
    }
  } catch (error) {
    Logger.error('Error fetching suggested favorites', error)
    throw new Error('Error fetching suggested favorites')
  }
}

const FAVORITE_PROJECTS_QUERY = `
   query featuredProjects($limit: Int!) {
     projectCollection(where: {OR: [{isFavorite: true}]}, limit: $limit) {
      items {
        name
        website
        logo {
          url
        }
      }
    }
  }
`

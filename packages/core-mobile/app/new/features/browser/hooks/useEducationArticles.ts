import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import Logger from 'utils/Logger'
import {
  getContentfulGraphQL,
  GraphQLResponse,
  ParsedGraphQLResponse
} from './useContentful'

const LIMIT = 40


export type ContentfulEducationArticle = {
  headline: string
  url: string
}

export function useFeaturedEducationArticles(): UseQueryResult<
  ParsedGraphQLResponse<ContentfulEducationArticle>,
  Error
> {
  return useQuery({
    queryKey: [ReactQueryKeys.FEATURED_EDUCATION_ARTICLES],
    queryFn: fetchEducationArticles
  })
}

async function fetchEducationArticles(): Promise<
  ParsedGraphQLResponse<ContentfulEducationArticle>
> {
  try {
    const request = getContentfulGraphQL(
      EDUCATION_ARTICLES_QUERY,
      'featuredEducationArticles',
      { limit: LIMIT }
    )
    const response = await fetch(request)
    const graphqlData =
      (await response.json()) as GraphQLResponse<ContentfulEducationArticle>

    if (graphqlData.data?.educationArticleCollection) {
      return {
        items: graphqlData.data.educationArticleCollection.items
      }
    }

    return {
      items: []
    }
  } catch (error) {
    Logger.error('Error fetching featured education articles', error)
    throw new Error('Error fetching featured education articles')
  }
}

const EDUCATION_ARTICLES_QUERY = `
  query featuredEducationArticles($limit: Int!) {
    educationArticleCollection(
      limit: $limit,
      where: {OR: [{isFeatured: true}]}
    ) {
      items {
        headline
        url
      }
    }
  }
`

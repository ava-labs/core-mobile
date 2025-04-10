const LIMIT = 40

const PROXY_ENDPOINT = `https://proxy-api.avax.network/proxy/contentful?`

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
    throw new Error('Failed to fetch from Contentful GraphQL')
  }
}

export async function fetchEcosystemProjects(): Promise<
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

export async function fetchFeaturedProjects(): Promise<
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

export async function fetchEducationArticles(): Promise<
  ParsedGraphQLResponse<ContentfulEducationArticle>
> {
  const request = await getContentfulGraphQL(
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

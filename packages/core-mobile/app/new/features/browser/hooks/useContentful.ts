import Config from 'react-native-config'

const CONTENTFUL_CORE_SPACE_ID = 'e2z03gbgxg1a'
const CONTENTFUL_CORE_ENVIRONMENT_ID = 'master'
const API_KEY = Config.CONTENTFUL_API_KEY

const LIMIT = 40

export type ContentfulResponse<T> = {
  items: T[]
  includes: {
    Asset: ContentfulAsset[]
  }
}

export type ContentfulAsset = {
  sys: {
    id: string
  }
  fields: {
    file: { url: string }
  }
}

export type ContentfulProject = {
  fields: {
    name: string
    description?: string
    website?: string
    logo?: {
      sys: {
        id: string
      }
    }
  }
}

export type ContentfulEcosystemProject = {
  fields: {
    name: string
    description?: string
    website?: string
    hideOnMobile?: boolean
    logo?: {
      sys: {
        id: string
      }
    }
  }
}

export type ContentfulEducationArticle = {
  fields: {
    headline: string
    url: string
  }
}

export async function getContentfulEntries(
  params: URLSearchParams
): Promise<Request> {
  try {
    return new Request(
      `https://cdn.contentful.com/spaces/${CONTENTFUL_CORE_SPACE_ID}/environments/${CONTENTFUL_CORE_ENVIRONMENT_ID}/entries?${params}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    throw new Error('Failed to fetch from Contentful')
  }
}

export async function fetchEcosystemProjects(): Promise<
  ContentfulResponse<ContentfulEcosystemProject>
> {
  const request = await getContentfulEntries(
    new URLSearchParams({
      content_type: 'ecosystemCarouselItem',
      limit: LIMIT.toString()
    })
  )

  const response = await fetch(request)

  return await response.json()
}

export async function fetchFeaturedProjects(): Promise<
  ContentfulResponse<ContentfulProject>
> {
  const request = await getContentfulEntries(
    new URLSearchParams({
      content_type: 'project',
      'fields.isFeatured': 'true',
      limit: LIMIT.toString()
    })
  )

  const response = await fetch(request)

  return await response.json()
}

export async function fetchEducationArticles(): Promise<
  ContentfulResponse<ContentfulEducationArticle>
> {
  const request = await getContentfulEntries(
    new URLSearchParams({
      content_type: 'educationArticle',
      'fields.isFeatured': 'true',
      limit: LIMIT.toString()
    })
  )

  const response = await fetch(request)

  return await response.json()
}

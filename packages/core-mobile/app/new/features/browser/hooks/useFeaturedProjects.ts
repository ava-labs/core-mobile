import Config from 'react-native-config'
import { useQuery, UseQueryResult } from '@tanstack/react-query'

const CONTENTFUL_CORE_SPACE_ID = 'e2z03gbgxg1a'
const CONTENTFUL_CORE_ENVIRONMENT_ID = 'master'

const API_KEY = Config.CONTENTFUL_API_KEY

export type ContentfulProject = {
  fields: {
    name: string
    description: string
    logo: {
      sys: {
        id: string
      }
    }
    website: string
  }
}

export type ContentfulResponse = {
  items: ContentfulProject[]
  includes: {
    Asset: any[]
  }
}

async function fetchFeaturedProjects(): Promise<ContentfulResponse> {
  const request = await getContentfulEntries(
    CONTENTFUL_CORE_SPACE_ID,
    CONTENTFUL_CORE_ENVIRONMENT_ID,
    new URLSearchParams({
      content_type: 'project',
      'fields.isFeatured': 'true',
      limit: '40'
    })
  )

  const response = await fetch(request)

  return await response.json()
}

export function useFeaturedProjects(): UseQueryResult<ContentfulResponse> {
  return useQuery({
    queryKey: ['discover-dapps'],
    queryFn: fetchFeaturedProjects,
    initialData: {
      items: [],
      includes: {
        Asset: []
      }
    }
  })
}

export async function getContentfulEntries(
  spaceId: string,
  environmentId: string,
  params: URLSearchParams
): Promise<Request> {
  try {
    return new Request(
      `https://cdn.contentful.com/spaces/${spaceId}/environments/${environmentId}/entries?${params}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    throw new Error('Failed to fetch dapps from Contentful')
  }
}

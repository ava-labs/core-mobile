import { Document } from '@contentful/rich-text-types'
import {
  GraphQLResponse,
  getContentfulGraphQL
} from 'common/hooks/useContentful'
import Logger from 'utils/Logger'

const TERMS_OF_USE_ID = '23SRqIENvEcuNn5axsXm4z'

type TermsAndServicesCollection = {
  content: {
    json: Document
  }
}

export const fetchTermsOfUse = async (): Promise<Document | undefined> => {
  try {
    const request = getContentfulGraphQL(
      TERMS_OF_USE_QUERY,
      'termsAndServices',
      { id: TERMS_OF_USE_ID }
    )
    const response = await fetch(request)
    const graphqlData =
      (await response.json()) as GraphQLResponse<TermsAndServicesCollection>

    return graphqlData.data.termsAndServicesCollection?.items?.[0]?.content
      ?.json
  } catch (error) {
    Logger.error('Failed to fetch terms of use', error)
    throw error
  }
}

const TERMS_OF_USE_QUERY = `
      query termsAndServices($id: String!) {
          termsAndServicesCollection(where: { sys: { id_in: [$id] } }) {
              items {
                  name
                  content {
                      json
                  }
              }
          }
      }
  `

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { Document } from '@contentful/rich-text-types'
import { fetchTermsOfUse } from 'features/onboarding/utils/fetchTermsOfUse'
import { ReactQueryKeys } from 'consts/reactQueryKeys'

export function useTermsOfUse(): UseQueryResult<Document, Error> {
  return useQuery({
    queryKey: [ReactQueryKeys.TERMS_OF_USE],
    queryFn: fetchTermsOfUse
  })
}

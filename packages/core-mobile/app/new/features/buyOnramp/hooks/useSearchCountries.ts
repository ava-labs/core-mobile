// search countries from meld api using react query

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import MeldService from 'services/meld/MeldService'

export type Country = {
  countryCode: string
  name: string
  flagImageUrl: string
  regions: string[] | null
}

export const useSearchCountries = (): UseQueryResult<Country[], Error> => {
  return useQuery<Country[]>({
    queryKey: ['meld', 'countries'],
    queryFn: () => MeldService.searchCountries(),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}

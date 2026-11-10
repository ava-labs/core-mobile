import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import MeldService from 'features/meld/services/MeldService'
import { Country, MeldDefaultParams } from '../types'

export const useSearchCountries = ({
  countries,
  categories
}: MeldDefaultParams): UseQueryResult<Country[], Error> => {
  return useQuery<Country[]>({
    queryKey: [ReactQueryKeys.MELD_SEARCH_COUNTRIES, categories, countries],
    queryFn: () => MeldService.searchCountries({ countries, categories }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}

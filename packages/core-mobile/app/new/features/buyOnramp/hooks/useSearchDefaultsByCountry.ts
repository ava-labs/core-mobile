import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { MeldDefaultParams, SearchDefaultsByCountry } from '../types'
import MeldService from '../services/MeldService'
import { useLocale } from './useLocale'

export type SearchDefaultsByCountryParams = MeldDefaultParams & {
  cryptoCurrencies?: string[]
}

export const useSearchDefaultsByCountry = ({
  categories,
  accountFilter = true
}: Omit<SearchDefaultsByCountryParams, 'countries'>): UseQueryResult<
  SearchDefaultsByCountry[],
  Error
> => {
  const { countryCode } = useLocale()

  return useQuery<SearchDefaultsByCountry[]>({
    queryKey: [
      ReactQueryKeys.MELD_SEARCH_DEFAULTS_BY_COUNTRY,
      categories,
      accountFilter,
      countryCode
    ],
    queryFn: () =>
      MeldService.searchDefaultsByCountry({
        countries: [countryCode],
        categories,
        accountFilter
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}

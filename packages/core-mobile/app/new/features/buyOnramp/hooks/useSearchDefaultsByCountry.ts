import { useQuery, UseQueryResult } from '@tanstack/react-query'
import MeldService from 'services/meld/MeldService'
import { SearchCryptoCurrenciesParams } from './useSearchCryptoCurrencies'
import { useLocale } from './useLocale'

export type SearchDefaultsByCountryResponse = {
  countryCode: string
  defaultCurrencyCode: string
  defaultPaymentMethods: string[]
}

export const useSearchDefaultsByCountry = ({
  categories,
  accountFilter = true
}: Omit<SearchCryptoCurrenciesParams, 'countries'>): UseQueryResult<
  SearchDefaultsByCountryResponse[],
  Error
> => {
  const { countryCode } = useLocale()

  return useQuery<SearchDefaultsByCountryResponse[]>({
    queryKey: ['meld', 'countries', categories, accountFilter, countryCode],
    queryFn: () =>
      MeldService.searchDefaultsByCountry({
        countries: [countryCode],
        categories,
        accountFilter
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import MeldService from 'features/meld/services/MeldService'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { FiatCurrency, SearchFiatCurrenciesParams } from '../types'

export const useSearchFiatCurrencies = ({
  countries,
  categories,
  fiatCurrencies
}: SearchFiatCurrenciesParams): UseQueryResult<FiatCurrency[], Error> => {
  return useQuery({
    queryKey: [
      ReactQueryKeys.MELD_SEARCH_FIAT_CURRENCIES,
      categories,
      countries,
      fiatCurrencies
    ],
    queryFn: () =>
      MeldService.searchFiatCurrencies({
        categories,
        fiatCurrencies,
        countries
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}

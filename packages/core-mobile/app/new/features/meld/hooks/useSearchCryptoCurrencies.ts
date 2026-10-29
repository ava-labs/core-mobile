import { useQuery, UseQueryResult } from '@tanstack/react-query'
import MeldService from 'features/meld/services/MeldService'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { CryptoCurrency, SearchCryptoCurrenciesParams } from '../types'
import { useMeldCountryCode } from '../store'

export const useSearchCryptoCurrencies = ({
  categories,
  cryptoCurrencies
}: Omit<SearchCryptoCurrenciesParams, 'countries'>): UseQueryResult<
  CryptoCurrency[],
  Error
> => {
  const [countryCode] = useMeldCountryCode()

  return useQuery({
    queryKey: [
      ReactQueryKeys.MELD_SEARCH_CRYPTO_CURRENCIES,
      categories,
      countryCode,
      cryptoCurrencies
    ],
    queryFn: () =>
      MeldService.searchCryptoCurrencies({
        cryptoCurrencies,
        categories,
        countries: countryCode ? [countryCode] : undefined
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}

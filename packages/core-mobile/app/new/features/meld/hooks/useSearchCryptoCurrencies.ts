import { useQuery, UseQueryResult } from '@tanstack/react-query'
import MeldService from 'features/meld/services/MeldService'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { CryptoCurrency, MeldDefaultParams } from '../types'
import { useMeldCountryCode } from '../store'
import { useSearchServiceProviders } from './useSearchServiceProviders'

export type SearchCryptoCurrenciesParams = MeldDefaultParams & {
  cryptoCurrencies?: string[]
}

export const useSearchCryptoCurrencies = ({
  categories,
  accountFilter = true,
  cryptoCurrencies
}: Omit<
  SearchCryptoCurrenciesParams,
  'countries' | 'serviceProviders'
>): UseQueryResult<CryptoCurrency[], Error> => {
  const { data: serviceProvidersData } = useSearchServiceProviders({
    categories
  })
  const serviceProviders = serviceProvidersData?.map(
    serviceProvider => serviceProvider.serviceProvider
  )
  const [countryCode] = useMeldCountryCode()

  return useQuery({
    enabled: serviceProviders && serviceProviders?.length > 0,
    queryKey: [
      ReactQueryKeys.MELD_SEARCH_CRYPTO_CURRENCIES,
      categories,
      serviceProviders,
      countryCode,
      accountFilter,
      cryptoCurrencies
    ],
    queryFn: () =>
      MeldService.searchCryptoCurrencies({
        cryptoCurrencies,
        categories,
        serviceProviders,
        countries: countryCode ? [countryCode] : undefined,
        accountFilter
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}

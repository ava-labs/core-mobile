import { useQuery, UseQueryResult } from '@tanstack/react-query'
import MeldService from 'features/meld/services/MeldService'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { FiatCurrency, MeldDefaultParams } from '../types'
import { useSearchServiceProviders } from './useSearchServiceProviders'
import { useLocale } from './useLocale'

export type SearchFiatCurrenciesParams = MeldDefaultParams & {
  fiatCurrencies?: string[]
}

export const useSearchFiatCurrencies = ({
  accountFilter,
  categories,
  fiatCurrencies
}: Omit<
  SearchFiatCurrenciesParams,
  'countries' | 'serviceProviders'
>): UseQueryResult<FiatCurrency[], Error> => {
  const { countryCode } = useLocale()
  const { data: serviceProvidersData } = useSearchServiceProviders({
    categories
  })
  const serviceProviders = serviceProvidersData?.map(
    serviceProvider => serviceProvider.serviceProvider
  )
  return useQuery({
    queryKey: [
      ReactQueryKeys.MELD_SEARCH_FIAT_CURRENCIES,
      accountFilter,
      serviceProviders,
      fiatCurrencies,
      countryCode,
      categories
    ],
    queryFn: () =>
      MeldService.searchFiatCurrencies({
        categories,
        accountFilter,
        serviceProviders,
        fiatCurrencies,
        countries: [countryCode]
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}

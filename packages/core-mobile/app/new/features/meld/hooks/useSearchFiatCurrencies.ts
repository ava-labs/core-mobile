import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { selectIsEnableMeldSandboxBlocked } from 'store/posthog/slice'
import { useSelector } from 'react-redux'
import MeldService from 'features/meld/services/MeldService'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { FiatCurrency, MeldDefaultParams } from '../types'
import { useSearchServiceProviders } from './useSearchServiceProviders'

export type SearchFiatCurrenciesParams = MeldDefaultParams & {
  fiatCurrencies?: string[]
}

export const useSearchFiatCurrencies = ({
  countries,
  accountFilter,
  categories,
  fiatCurrencies
}: Omit<SearchFiatCurrenciesParams, 'serviceProviders'>): UseQueryResult<
  FiatCurrency[],
  Error
> => {
  const isSandboxBlocked = useSelector(selectIsEnableMeldSandboxBlocked)
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
      countries,
      categories,
      isSandboxBlocked
    ],
    queryFn: () =>
      MeldService.searchFiatCurrencies({
        sandbox: !isSandboxBlocked,
        categories,
        accountFilter,
        serviceProviders,
        fiatCurrencies,
        countries
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { selectIsEnableMeldSandboxBlocked } from 'store/posthog/slice'
import { useSelector } from 'react-redux'
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
  const isSandboxBlocked = useSelector(selectIsEnableMeldSandboxBlocked)
  const { data: serviceProvidersData } = useSearchServiceProviders({
    categories
  })
  const serviceProviders = serviceProvidersData?.map(
    serviceProvider => serviceProvider.serviceProvider
  )
  const [countryCode] = useMeldCountryCode()

  return useQuery({
    enabled: !!serviceProviders,
    queryKey: [
      ReactQueryKeys.MELD_SEARCH_CRYPTO_CURRENCIES,
      categories,
      serviceProviders,
      countryCode,
      accountFilter,
      cryptoCurrencies,
      isSandboxBlocked
    ],
    queryFn: () =>
      MeldService.searchCryptoCurrencies({
        sandbox: !isSandboxBlocked,
        cryptoCurrencies,
        categories,
        serviceProviders,
        countries: countryCode ? [countryCode] : undefined,
        accountFilter
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}

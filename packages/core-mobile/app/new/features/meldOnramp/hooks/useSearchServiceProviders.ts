import { useQuery, UseQueryResult } from '@tanstack/react-query'
<<<<<<<< HEAD:packages/core-mobile/app/new/features/meld/hooks/useSearchServiceProviders.ts
import MeldService from 'features/meld/services/MeldService'
========
import MeldService from 'features/meldOnramp/services/MeldService'
>>>>>>>> b13ee487b (rename folders):packages/core-mobile/app/new/features/meldOnramp/hooks/useSearchServiceProviders.ts
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { MeldDefaultParams, ServiceProvider } from '../types'
import { useLocale } from './useLocale'

export type SearchServiceProvidersParams = Omit<
  MeldDefaultParams,
  'serviceProviders'
> & {
  cryptoCurrencies?: string[]
}

export const useSearchServiceProviders = ({
  categories,
  accountFilter = true,
  cryptoCurrencies
}: Omit<SearchServiceProvidersParams, 'countries'>): UseQueryResult<
  ServiceProvider[],
  Error
> => {
  const { countryCode } = useLocale()

  return useQuery<ServiceProvider[]>({
    queryKey: [
      ReactQueryKeys.MELD_SEARCH_SERVICE_PROVIDERS,
      categories,
      accountFilter,
      countryCode,
      cryptoCurrencies
    ],
    queryFn: () =>
      MeldService.searchServiceProviders({
        countries: [countryCode],
        categories,
        accountFilter,
        cryptoCurrencies
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}

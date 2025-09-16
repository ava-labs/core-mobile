import { useQuery, UseQueryResult } from '@tanstack/react-query'
import MeldService from 'features/meld/services/MeldService'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { MeldDefaultParams, ServiceProvider } from '../types'

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
  return useQuery<ServiceProvider[]>({
    queryKey: [
      ReactQueryKeys.MELD_SEARCH_SERVICE_PROVIDERS,
      categories,
      accountFilter,
      cryptoCurrencies
    ],
    queryFn: () =>
      MeldService.searchServiceProviders({
        categories,
        accountFilter,
        cryptoCurrencies
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}

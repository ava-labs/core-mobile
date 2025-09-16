import { useQuery, UseQueryResult } from '@tanstack/react-query'
import MeldService from 'features/meld/services/MeldService'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { selectIsEnableMeldSandboxBlocked } from 'store/posthog/slice'
import { useSelector } from 'react-redux'
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
  const isSandboxBlocked = useSelector(selectIsEnableMeldSandboxBlocked)
  return useQuery<ServiceProvider[]>({
    queryKey: [
      ReactQueryKeys.MELD_SEARCH_SERVICE_PROVIDERS,
      categories,
      accountFilter,
      cryptoCurrencies,
      isSandboxBlocked
    ],
    queryFn: () =>
      MeldService.searchServiceProviders({
        sandbox: !isSandboxBlocked,
        categories,
        accountFilter,
        cryptoCurrencies
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}

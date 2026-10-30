import { useQuery, UseQueryResult } from '@tanstack/react-query'
import MeldService from 'features/meld/services/MeldService'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { MeldDefaultParams, ServiceProvider } from '../types'

export const useSearchServiceProviders = ({
  categories
}: Omit<MeldDefaultParams, 'countries'>): UseQueryResult<
  ServiceProvider[],
  Error
> => {
  return useQuery<ServiceProvider[]>({
    queryKey: [ReactQueryKeys.MELD_SEARCH_SERVICE_PROVIDERS, categories],
    queryFn: () => MeldService.searchServiceProviders({ categories }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}

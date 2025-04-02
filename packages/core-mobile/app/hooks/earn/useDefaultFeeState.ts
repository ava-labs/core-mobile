import { pvm } from '@avalabs/avalanchejs'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'

const REFETCH_INTERVAL = 1000 * 60 * 1 // 1 minute

export const useDefaultFeeState = (): UseQueryResult<
  pvm.FeeState | undefined,
  Error
> => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  return useQuery({
    retry: false,
    refetchInterval: REFETCH_INTERVAL,
    queryKey: ['defaultFeeState', isDeveloperMode],
    queryFn: async () => {
      const provider = await NetworkService.getAvalancheProviderXP(
        isDeveloperMode
      )

      return provider.getApiP().getFeeState()
    }
  })
}

import { pvm } from '@avalabs/avalanchejs'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import NetworkService from 'services/network/NetworkService'
import { selectActiveNetwork } from 'store/network'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { isDevnet } from 'utils/isDevnet'

const REFETCH_INTERVAL = 1000 * 60 * 1 // 1 minute

export const useDefaultFeeState = (): UseQueryResult<
  pvm.FeeState | undefined,
  Error
> => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const network = useSelector(selectActiveNetwork)
  const devnet = isDevnet(network)

  return useQuery({
    retry: false,
    refetchInterval: REFETCH_INTERVAL,
    queryKey: ['defaultFeeState', isDeveloperMode, devnet],
    queryFn: async () => {
      const provider = await NetworkService.getAvalancheProviderXP(
        isDeveloperMode,
        devnet
      )

      if (provider.isEtnaEnabled()) {
        return provider.getApiP().getFeeState()
      }
      return undefined
    }
  })
}

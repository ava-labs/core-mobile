import { pvm } from '@avalabs/avalanchejs'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import NetworkService from 'services/network/NetworkService'
import { selectActiveNetwork } from 'store/network'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { isDevnet } from 'utils/isDevnet'

export const useNodes = (): UseQueryResult<
  pvm.GetCurrentValidatorsResponse,
  Error
> => {
  const network = useSelector(selectActiveNetwork)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const devnet = isDevnet(network)

  return useQuery({
    queryKey: ['nodes', isDeveloperMode, devnet],
    queryFn: async () => {
      const provider = await NetworkService.getAvalancheProviderXP(
        isDeveloperMode,
        devnet
      )
      return EarnService.getCurrentValidators(provider)
    }
  })
}

import { pvm } from '@avalabs/avalanchejs'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const useNodes = (
  enabled = true
): UseQueryResult<pvm.GetCurrentValidatorsResponse, Error> => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  return useQuery({
    queryKey: ['nodes', isDeveloperMode],
    enabled,
    queryFn: async () => {
      const provider = await NetworkService.getAvalancheProviderXP(
        isDeveloperMode
      )
      return EarnService.getCurrentValidators(provider)
    }
  })
}

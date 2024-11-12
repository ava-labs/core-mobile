import { pvm } from '@avalabs/avalanchejs'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useAvalancheXpProvider } from 'hooks/networks/networkProviderHooks'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const useNodes = (): UseQueryResult<
  pvm.GetCurrentValidatorsResponse,
  Error
> => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const provider = useAvalancheXpProvider(isDeveloperMode)

  return useQuery({
    queryKey: ['nodes', provider],
    queryFn: () => {
      if (!provider) {
        return Promise.reject('Avalanche provider is not available')
      }
      return EarnService.getCurrentValidators(provider)
    }
  })
}

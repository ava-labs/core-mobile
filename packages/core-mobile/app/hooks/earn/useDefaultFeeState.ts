import { pvm } from '@avalabs/avalanchejs'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useAvalancheXpProvider } from 'hooks/networks/networkProviderHooks'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const useDefaultFeeState = (): UseQueryResult<
  pvm.FeeState | undefined,
  Error
> => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const avaxProvider = useAvalancheXpProvider(isDeveloperMode)

  return useQuery({
    retry: false,
    queryKey: ['defaultFeeState', isDeveloperMode, avaxProvider],
    queryFn: async () => {
      if (!avaxProvider) {
        return Promise.reject('avaxProvider is not available')
      }
      return avaxProvider
        .getApiP()
        .getFeeState()
        .catch(() => undefined)
    }
  })
}

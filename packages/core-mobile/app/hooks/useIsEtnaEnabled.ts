import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { info } from '@avalabs/avalanchejs'
import NetworkService from 'services/network/NetworkService'
import { useNetworks } from './networks/useNetworks'

export const useIsEtnaEnabled = (): UseQueryResult<
  info.GetUpgradesInfoResponse | undefined
> => {
  const { activeNetwork } = useNetworks()
  return useQuery({
    queryKey: ['isEtnaEnabled', activeNetwork],
    queryFn: async () => NetworkService.isEtnaEnabled(activeNetwork)
  })
}

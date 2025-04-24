import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useSelector } from 'react-redux'
import NetworkService from 'services/network/NetworkService'
import { selectActiveAccount } from 'store/account'
import { Networks } from 'store/network'

export const useGetNetworks = (): UseQueryResult<Networks, Error> => {
  const address = useSelector(selectActiveAccount)?.addressC

  return useQuery({
    enabled: !!address,
    queryKey: [ReactQueryKeys.NETWORKS, address],
    queryFn: () => NetworkService.getNetworks(address),
    staleTime: Infinity,
    networkMode: 'always'
  })
}

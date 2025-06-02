import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import NetworkService from 'services/network/NetworkService'
import { Networks } from 'store/network'

export const useGetNetworks = ({
  includeSolana
}: {
  includeSolana: boolean
}): UseQueryResult<Networks, Error> => {
  return useQuery({
    queryKey: [ReactQueryKeys.NETWORKS, includeSolana],
    queryFn: () =>
      NetworkService.getNetworks({
        includeSolana: !isSolanaSupportBlocked
      }),
    staleTime: 240000, // 4 mins,
    networkMode: 'always'
  })
}

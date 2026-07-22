import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import NetworkService from 'services/network/NetworkService'
import { Networks } from 'store/network'

export const useGetNetworks = ({
  includeSolana,
  includeHyperliquid
}: {
  includeSolana: boolean
  includeHyperliquid: boolean
}): UseQueryResult<Networks, Error> => {
  return useQuery({
    queryKey: [ReactQueryKeys.NETWORKS, includeSolana, includeHyperliquid],
    queryFn: () =>
      NetworkService.getNetworks({
        includeSolana,
        includeHyperliquid
      }),
    staleTime: 240000, // 4 mins,
    networkMode: 'always'
  })
}

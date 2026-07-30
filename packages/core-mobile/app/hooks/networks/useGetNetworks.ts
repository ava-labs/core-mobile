import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useCallback } from 'react'
import NetworkService from 'services/network/NetworkService'
import { Networks } from 'store/network'
import { filterOutHyperliquidNetworks } from 'utils/network/isHyperliquidNetwork'

export const useGetNetworks = ({
  includeSolana,
  includeHyperliquid
}: {
  includeSolana: boolean
  includeHyperliquid: boolean
}): UseQueryResult<Networks, Error> => {
  // Hyperliquid gating is a read-time filter (via `select`), not part of the
  // query key: the cached /networks response stays unfiltered, so flipping the
  // hyperliquid-support flag re-derives instantly instead of refetching
  const select = useCallback(
    (networks: Networks): Networks =>
      includeHyperliquid ? networks : filterOutHyperliquidNetworks(networks),
    [includeHyperliquid]
  )

  return useQuery({
    queryKey: [ReactQueryKeys.NETWORKS, includeSolana],
    queryFn: () =>
      NetworkService.getNetworks({
        includeSolana
      }),
    select,
    staleTime: 240000, // 4 mins,
    networkMode: 'always'
  })
}

import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { queryClient } from 'contexts/ReactQueryProvider'
import { Networks } from 'store/network'

export const getNetworksFromCache = ({
  includeSolana = false,
  includeHyperliquid = false
}: {
  includeSolana: boolean
  includeHyperliquid: boolean
}): Networks | undefined => {
  return queryClient.getQueryCache().find({
    queryKey: [ReactQueryKeys.NETWORKS, includeSolana, includeHyperliquid]
  })?.state.data as Networks | undefined
}

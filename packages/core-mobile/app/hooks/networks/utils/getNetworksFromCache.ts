import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { queryClient } from 'contexts/ReactQueryProvider'
import { Networks } from 'store/network'

export const getNetworksFromCache = ({
  includeSolana,
  includeHyperliquid
}: {
  includeSolana: boolean
  includeHyperliquid: boolean
}): Networks | undefined => {
  return queryClient.getQueryData<Networks>([
    ReactQueryKeys.NETWORKS,
    includeSolana,
    includeHyperliquid
  ])
}

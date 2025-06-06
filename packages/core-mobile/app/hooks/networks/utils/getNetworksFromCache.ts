import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { queryClient } from 'contexts/ReactQueryProvider'
import { Networks } from 'store/network'

export const getNetworksFromCache = ({
  includeSolana = false
}: {
  includeSolana: boolean
}): Networks | undefined => {
  return queryClient.getQueryCache().find({
    queryKey: [ReactQueryKeys.NETWORKS, includeSolana]
  })?.state.data as Networks | undefined
}

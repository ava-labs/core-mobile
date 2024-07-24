import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { queryClient } from 'contexts/ReactQueryProvider'
import { Networks } from 'store/network'

export const getNetworksFromCache = (): Networks | undefined => {
  return queryClient.getQueryCache().find({
    queryKey: [ReactQueryKeys.NETWORKS]
  })?.state.data as Networks | undefined
}

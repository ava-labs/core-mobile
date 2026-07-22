import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { queryClient } from 'contexts/ReactQueryProvider'
import { Networks } from 'store/network'
import { filterOutHyperliquidNetworks } from 'utils/network/isHyperliquidNetwork'

export const getNetworksFromCache = ({
  includeSolana,
  includeHyperliquid
}: {
  includeSolana: boolean
  includeHyperliquid: boolean
}): Networks | undefined => {
  const networks = queryClient.getQueryData<Networks>([
    ReactQueryKeys.NETWORKS,
    includeSolana
  ])

  if (networks === undefined || includeHyperliquid) {
    return networks
  }

  return filterOutHyperliquidNetworks(networks)
}

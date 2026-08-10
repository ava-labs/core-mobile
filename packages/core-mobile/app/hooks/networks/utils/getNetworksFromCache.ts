import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { queryClient } from 'contexts/ReactQueryProvider'
import { Networks } from 'store/network'
import { memoizeByReference } from 'utils/memoizeByReference'
import { filterOutHyperliquidNetworks } from 'utils/network/isHyperliquidNetwork'

/**
 * Memoized on reference equality -- `filterOutHyperliquidNetworks` allocates
 * fresh on every call, which broke every downstream `createSelector` memo.
 * CP-14918.
 */
const filterOutHyperliquidNetworksMemoized = memoizeByReference(
  filterOutHyperliquidNetworks
)

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

  return filterOutHyperliquidNetworksMemoized(networks)
}

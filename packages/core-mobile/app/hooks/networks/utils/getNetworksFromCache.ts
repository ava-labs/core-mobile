import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { queryClient } from 'contexts/ReactQueryProvider'
import { Networks } from 'store/network'
import { memoizeByReference } from 'utils/memoizeByReference'
import { filterOutHyperliquidNetworks } from 'utils/network/isHyperliquidNetwork'

/**
 * `filterOutHyperliquidNetworks` allocates a new object on every call, which
 * made this read layer return a new reference every time the hyperliquid flag
 * was off (the default). That identity churn propagated into `selectNetworks`
 * and broke every downstream createSelector memo (CP-14918).
 *
 * Memoized on reference equality (cache size 1), so the filtered map keeps a
 * stable identity for as long as the cached /networks response is unchanged,
 * and recomputes as soon as that response is replaced.
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

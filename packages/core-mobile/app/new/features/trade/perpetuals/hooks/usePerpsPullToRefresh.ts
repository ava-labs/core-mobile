import { useQueryClient } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useCallback, useState } from 'react'
import { usePerps } from '../contexts/PerpsProvider'

/**
 * Pull-to-refresh for the perps lists (positions / open orders / activity).
 *
 * `refreshAfterTrade` bumps the clearinghouse nonce, which re-runs every
 * nonce-keyed REST fetch (clearinghouse state, main-dex + HIP-3 open orders)
 * and invalidates the perps react-query caches. The nonce-driven fetches
 * expose no promise, so the spinner is tied to the clearinghouse query's
 * refetch (the same REST round-trip class) plus any caller-supplied refresh
 * (e.g. the user-fills refetch backing closed positions / activity).
 */
export const usePerpsPullToRefresh = (
  extraRefresh?: () => Promise<unknown>
): { isRefreshing: boolean; onRefresh: () => void } => {
  const queryClient = useQueryClient()
  const { refreshAfterTrade } = usePerps()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const onRefresh = useCallback(() => {
    setIsRefreshing(true)
    refreshAfterTrade()
    const waits: Promise<unknown>[] = [
      queryClient.invalidateQueries({
        queryKey: [ReactQueryKeys.PERPS_CLEARINGHOUSE]
      })
    ]
    if (extraRefresh !== undefined) {
      waits.push(extraRefresh())
    }
    void Promise.allSettled(waits).then(() => setIsRefreshing(false))
  }, [queryClient, refreshAfterTrade, extraRefresh])

  return { isRefreshing, onRefresh }
}

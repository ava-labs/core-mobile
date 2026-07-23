import { useQueryClient } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useCallback, useState } from 'react'
import { usePerps } from '../contexts/PerpsProvider'

/**
 * Pull-to-refresh for the perps lists (positions / open orders / activity).
 *
 * `refreshClearinghouse` bumps the shared nonce, which re-runs every
 * nonce-keyed fetch (the clearinghouse query has the nonce in its key; the
 * main-dex + HIP-3 open-orders effects re-fetch on it). Those fetches expose
 * no promise, so the spinner is tied to an awaited invalidation of the
 * clearinghouse query (the same REST round-trip class) plus any
 * caller-supplied refresh (e.g. the user-fills refetch backing closed
 * positions / activity). Re-entrant pulls while a refresh is in flight are
 * ignored so an early settle can't hide a later pending one.
 */
export const usePerpsPullToRefresh = (
  extraRefresh?: () => Promise<unknown>
): { isRefreshing: boolean; onRefresh: () => void } => {
  const queryClient = useQueryClient()
  const { refreshClearinghouse } = usePerps()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const onRefresh = useCallback(() => {
    if (isRefreshing) {
      return
    }
    setIsRefreshing(true)
    refreshClearinghouse()
    const waits: Promise<unknown>[] = [
      queryClient.invalidateQueries({
        queryKey: [ReactQueryKeys.PERPS_CLEARINGHOUSE]
      })
    ]
    if (extraRefresh !== undefined) {
      waits.push(extraRefresh())
    }
    void Promise.allSettled(waits).then(() => setIsRefreshing(false))
  }, [isRefreshing, queryClient, refreshClearinghouse, extraRefresh])

  return { isRefreshing, onRefresh }
}

import { UseQueryResult, useQuery, useQueryClient } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useContext, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import WatchlistService from 'services/watchlist/WatchlistService'
import { selectSelectedCurrency } from 'store/settings/currency'
import { runAfterInteractions } from 'utils/runAfterInteractions'
import {
  TopTokensData,
  TopTokensQueryContext,
  WatchlistQueryValue
} from './watchlistQueriesContext'

// CP-14918 TEMP PROBE: diff consecutive observerResultsUpdated notifications
// for this one query key, to find WHY it fires ~40x per navigation. Buckets
// the changed-field set into a histogram flushed every 2s.
const watchlistTopTokensHistogram: Record<string, number> = {}
let watchlistTopTokensTimer: ReturnType<typeof setInterval> | undefined

export const useTopTokensQuery = (): UseQueryResult<TopTokensData, Error> => {
  const currency = useSelector(selectSelectedCurrency)
  const queryClient = useQueryClient()

  // CP-14918 TEMP PROBE
  const prevSnapshotRef = useRef<{
    dataRef: unknown
    isFetching: boolean
    isLoading: boolean
    status: string
    dataUpdatedAt: number
    errorUpdatedAt: number
    fetchStatus: string
  } | null>(null)

  // eslint-disable-next-line sonarjs/cognitive-complexity -- CP-14918 TEMP PROBE inflates complexity; strip with the probe
  useEffect(() => {
    const cache = queryClient.getQueryCache()
    const targetKey = JSON.stringify([
      ReactQueryKeys.WATCHLIST_TOP_TOKENS,
      currency
    ])

    return cache.subscribe(event => {
      if (event.type !== 'observerResultsUpdated') return
      if (JSON.stringify(event.query.queryKey) !== targetKey) return

      const state = event.query.state
      const curr = {
        dataRef: state.data,
        isFetching: state.fetchStatus === 'fetching',
        isLoading: state.status === 'pending',
        status: state.status,
        dataUpdatedAt: state.dataUpdatedAt,
        errorUpdatedAt: state.errorUpdatedAt,
        fetchStatus: state.fetchStatus
      }

      const prev = prevSnapshotRef.current
      let bucketKey: string
      if (!prev) {
        bucketKey = 'MOUNT'
      } else {
        const changed: string[] = []
        if (curr.dataRef !== prev.dataRef) changed.push('dataRef')
        if (curr.isFetching !== prev.isFetching) changed.push('isFetching')
        if (curr.isLoading !== prev.isLoading) changed.push('isLoading')
        if (curr.status !== prev.status) changed.push('status')
        if (curr.dataUpdatedAt !== prev.dataUpdatedAt)
          changed.push('dataUpdatedAt')
        if (curr.errorUpdatedAt !== prev.errorUpdatedAt)
          changed.push('errorUpdatedAt')
        if (curr.fetchStatus !== prev.fetchStatus) changed.push('fetchStatus')
        bucketKey = changed.length > 0 ? changed.join('+') : 'NOTHING'
      }
      prevSnapshotRef.current = curr

      watchlistTopTokensHistogram[bucketKey] =
        (watchlistTopTokensHistogram[bucketKey] ?? 0) + 1

      if (!watchlistTopTokensTimer) {
        watchlistTopTokensTimer = setInterval(() => {
          const keys = Object.keys(watchlistTopTokensHistogram)
          if (keys.length === 0) return
          const parts = keys.map(k => `${k}=${watchlistTopTokensHistogram[k]}`)
          // eslint-disable-next-line no-console
          console.log(
            `PERFPROBE rq.watchlistTopTokens.changedFields ${parts.join(' ')}`
          )
          keys.forEach(k => delete watchlistTopTokensHistogram[k])
        }, 2000)
      }
    })
  }, [queryClient, currency])

  return useQuery({
    queryKey: [ReactQueryKeys.WATCHLIST_TOP_TOKENS, currency],
    queryFn: () => {
      return runAfterInteractions(async () => {
        return WatchlistService.getTopTokens(currency)
      })
    },
    refetchInterval: 120000 // 2 minutes
    // CP-14918 fix-round-1: deliberately NOT `notifyOnChangeProps: 'all'`.
    // That disables react-query's default tracked-props gating entirely
    // (queryObserver.ts:682-687: 'all' short-circuits straight to "notify"),
    // so ANY field flip -- including `isStale` flipping ~10s after every
    // fetch purely from the global `staleTime: 10000` elapsing
    // (queryObserver.ts's #updateStaleTimeout calling a bare
    // `updateResult()`, ReactQueryProvider.tsx:27) -- would re-render this
    // provider, and therefore (since it fed the raw result straight into
    // Context) every one of the 20+ consumers below it. Left at the v5
    // default: <WatchlistQueriesProvider> below destructures only
    // `{ data, isLoading, isRefetching, refetch }` from this hook's return,
    // which marks exactly those 4 properties as "tracked" on this observer
    // (queryObserver.ts's `trackResult` Proxy). `isStale`/`fetchStatus`/
    // `status`/`dataUpdatedAt`/etc. are never read, so a change confined to
    // those fields makes `shouldNotifyListeners()` return false and this
    // hook's `useSyncExternalStore` subscriber never fires -- the provider
    // itself doesn't even re-render, let alone its consumers.
  })
}

/**
 * Shared, deduped read of the top-tokens query. Must be called under
 * <WatchlistQueriesProvider> (mounted once in `(signedIn)/_layout.tsx`).
 * Throws otherwise, rather than silently creating a second observer.
 *
 * Returns a narrow `{ data, isLoading, isRefetching, refetch }` shape, not
 * the full `UseQueryResult` -- see the comment on `WatchlistQueryValue` in
 * watchlistQueriesContext.ts.
 */
export const useTopTokens = (): WatchlistQueryValue<TopTokensData> => {
  const query = useContext(TopTokensQueryContext)
  if (!query) {
    throw new Error(
      'useTopTokens() must be used within a <WatchlistQueriesProvider> (CP-14918: shared observer fix)'
    )
  }
  return query
}

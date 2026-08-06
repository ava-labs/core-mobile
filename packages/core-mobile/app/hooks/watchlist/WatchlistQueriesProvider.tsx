import React, { FC, PropsWithChildren, useMemo } from 'react'
import { useTrendingTokensQuery } from './useGetTrendingTokens'
import { useTopTokensQuery } from './useTopTokens'
import {
  TopTokensQueryContext,
  TrendingTokensQueryContext
} from './watchlistQueriesContext'

/**
 * CP-14918 (react-query observer fan-out): `useWatchlist()` -- and therefore
 * `useTopTokens()` / `useGetTrendingTokens()` -- is called from 20+
 * components across the signed-in app, several of them per render on a
 * single screen (e.g. once per row in a token list). Every call used to
 * mount its own `QueryObserver` for the SAME `[WATCHLIST_TOP_TOKENS,
 * currency]` / `[WATCHLIST_TRENDING_TOKENS, exchangeRate]` cache entries:
 * react-query dedupes the underlying fetch, but NOT the Observer, so every
 * mounted consumer re-notified the QueryCache on every shared state change
 * -- even the ones sitting behind a just-pushed modal, and even when the
 * notification carried no new data.
 *
 * Mounting the two underlying queries ONCE here -- instead of once per
 * `useWatchlist()` caller -- collapses that fan-out to exactly one observer
 * per key, no matter how many components read from it. This mirrors the
 * existing `<LastTransactedNetworks />` singleton-subscription mount already
 * used in `(signedIn)/_layout.tsx` for the same class of problem.
 *
 * CP-14918 fix-round-1 (adversarial review correction): the first pass of
 * this fix passed the RAW `useQuery()` result straight through Context with
 * `notifyOnChangeProps: 'all'`. That combination reintroduced the exact
 * problem it was meant to fix -- `'all'` disables react-query's
 * tracked-props gating outright (queryObserver.ts:682-687: `'all'`
 * short-circuits straight to "notify"), so ANY field flip -- most notably
 * `isStale` flipping ~10s after every fetch, purely from the global
 * `staleTime: 10000` in ReactQueryProvider.tsx elapsing, with zero data
 * change (queryObserver.ts's `#updateStaleTimeout`, a bare `updateResult()`
 * with no fetch) -- produced a new result object, which, fed directly into
 * Context, re-rendered every one of the 20+ consumers below this provider
 * on every such tick. Fixed by:
 *   1. NOT using `notifyOnChangeProps: 'all'` in `useTopTokensQuery` /
 *      `useTrendingTokensQuery` (left at the v5 default).
 *   2. Destructuring ONLY the 4 fields real consumers read --
 *      `{ data, isLoading, isRefetching, refetch }` (confirmed by grepping
 *      every call site; `useWatchlist.ts` is the only real caller of
 *      `useTopTokens()` / `useGetTrendingTokens()` and reads exactly these
 *      4 fields). Reading a property off react-query's `trackResult()`
 *      Proxy is what marks it "tracked" on the observer (queryObserver.ts
 *      `trackProp`) -- so this is what makes an
 *      isStale/fetchStatus/status/dataUpdatedAt-only transition invisible
 *      to this observer's own listener in the first place, not merely
 *      invisible in the object handed down.
 *   3. Explicitly `useMemo`-ing the narrow context values on exactly those
 *      4 fields, instead of relying on React Compiler to infer that this
 *      component's output is stable -- so even if this provider re-renders
 *      for an unrelated reason (e.g. a parent re-render), `Context.Provider`
 *      still stops propagation to consumers via its own `Object.is` check
 *      when nothing in the narrow shape changed.
 *
 * Disclosed, NOT fully preserved: the per-call-site
 * `enabled: useIsFocused()` gate that used to pause polling while an
 * individual screen was unfocused is dropped along with the per-call-site
 * `useQuery`s -- there's no single screen-focus value to read once the
 * query is hoisted above ~10 different screens, and a small ref-counted
 * "which screens currently want this" mechanism was judged not achievable
 * both small and provably-correct here (see task-O-report.md, "Focus-gating
 * trade-off", for the full quantified delta: which queries, their
 * interval/staleTime, and exactly what extra requests happen for screens
 * that consume neither query). This was a deliberate build-vs-disclose
 * call, escalated for a human decision, not a silent regression.
 */
export const WatchlistQueriesProvider: FC<PropsWithChildren> = ({
  children
}) => {
  const {
    data: topTokensData,
    isLoading: topTokensIsLoading,
    isRefetching: topTokensIsRefetching,
    refetch: refetchTopTokens
  } = useTopTokensQuery()

  const {
    data: trendingTokensData,
    isLoading: trendingTokensIsLoading,
    isRefetching: trendingTokensIsRefetching,
    refetch: refetchTrendingTokens
  } = useTrendingTokensQuery()

  const topTokensValue = useMemo(
    () => ({
      data: topTokensData,
      isLoading: topTokensIsLoading,
      isRefetching: topTokensIsRefetching,
      refetch: refetchTopTokens
    }),
    [topTokensData, topTokensIsLoading, topTokensIsRefetching, refetchTopTokens]
  )

  const trendingTokensValue = useMemo(
    () => ({
      data: trendingTokensData,
      isLoading: trendingTokensIsLoading,
      isRefetching: trendingTokensIsRefetching,
      refetch: refetchTrendingTokens
    }),
    [
      trendingTokensData,
      trendingTokensIsLoading,
      trendingTokensIsRefetching,
      refetchTrendingTokens
    ]
  )

  return (
    <TopTokensQueryContext.Provider value={topTokensValue}>
      <TrendingTokensQueryContext.Provider value={trendingTokensValue}>
        {children}
      </TrendingTokensQueryContext.Provider>
    </TopTokensQueryContext.Provider>
  )
}

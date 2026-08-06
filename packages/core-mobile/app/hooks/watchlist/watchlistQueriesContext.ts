import { UseQueryResult } from '@tanstack/react-query'
import { createContext } from 'react'
import { Charts, MarketToken, Prices } from 'store/watchlist'
import { TrendingToken } from 'utils/api/types'

// CP-14918: split into its own file (no logic) so useTopTokens.ts /
// useGetTrendingTokens.ts and WatchlistQueriesProvider.tsx can both import
// the context objects without creating a module cycle.

export type TopTokensData = {
  tokens: Record<string, MarketToken>
  charts: Charts
  prices: Prices
}

// CP-14918 fix-round-1: the context value is deliberately NOT the full
// `UseQueryResult` (see the adversarial review's Critical finding). The
// only real consumer of these hooks (`useWatchlist.ts`) destructures
// exactly `{ data, isLoading, refetch, isRefetching }`; everything else
// (`status`, `isFetching`, `isStale`, `fetchStatus`, `dataUpdatedAt`, ...)
// is intentionally excluded from the exported type so a future caller
// can't silently read `undefined` off a field this hook never populates,
// AND so the shared observer only ever tracks these 4 props (see
// useTopTokens.ts / WatchlistQueriesProvider.tsx for how that's enforced).
export type WatchlistQueryValue<TData> = {
  data: TData | undefined
  isLoading: boolean
  isRefetching: boolean
  // Deliberately NOT `UseQueryResult<TData, Error>['refetch']`: `TData` here
  // may be the result of a client-side `select` applied in the thin wrapper
  // (see useGetTrendingTokens.ts), but `refetch()` always resolves with the
  // SHARED, un-selected observer result. Every current caller only awaits
  // `refetch()` for its side effect (never reads the resolved value), so
  // typing the resolved value honestly as `unknown`'s query result -- rather
  // than falsely promising `TData` -- avoids the same "silent lie" class of
  // bug this type exists to prevent for `data`/`isLoading`/`isRefetching`.
  refetch: UseQueryResult<unknown, Error>['refetch']
}

export const TopTokensQueryContext = createContext<
  WatchlistQueryValue<TopTokensData> | undefined
>(undefined)

export const TrendingTokensQueryContext = createContext<
  WatchlistQueryValue<TrendingToken[]> | undefined
>(undefined)

import type { UseQueryResult } from '@tanstack/react-query'
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

// `WatchlistQueryValue` is deliberately narrow (`data`/`isLoading`/
// `isRefetching`/`refetch` only) -- widening it lets the shared observer
// track more fields and re-opens the fan-out this type exists to close. CP-14918.
export type WatchlistQueryValue<TData> = {
  data: TData | undefined
  isLoading: boolean
  isRefetching: boolean
  // `refetch`'s resolved value is typed `unknown`, not `TData` -- it resolves
  // with the shared, unselected observer result; every caller only awaits
  // it for the side effect. CP-14918.
  refetch: UseQueryResult<unknown, Error>['refetch']
}

export const TopTokensQueryContext = createContext<
  WatchlistQueryValue<TopTokensData> | undefined
>(undefined)

export const TrendingTokensQueryContext = createContext<
  WatchlistQueryValue<TrendingToken[]> | undefined
>(undefined)

import React, { FC, PropsWithChildren, useMemo } from 'react'
import { useTrendingTokensQuery } from './useGetTrendingTokens'
import { useTopTokensQuery } from './useTopTokens'
import {
  TopTokensQueryContext,
  TrendingTokensQueryContext
} from './watchlistQueriesContext'

/**
 * Hoists `useTopTokensQuery`/`useTrendingTokensQuery` to one shared observer
 * per key (was: one per `useWatchlist()` caller, 20+ call sites). Context
 * value must stay narrow + tracked-props default (not `'all'`) -- see
 * `useTopTokens.ts`; reintroducing either re-opens the fan-out. Dropped, not
 * restored: the old per-call-site `useIsFocused()` pause gate -- Open
 * decision #1 (doc §15.7), not yet resolved. CP-14918.
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

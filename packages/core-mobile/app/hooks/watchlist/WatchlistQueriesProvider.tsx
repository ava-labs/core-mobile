import React, { FC, PropsWithChildren, useMemo } from 'react'
import { useTrendingTokensQuery } from './useGetTrendingTokens'
import { useTopTokensQuery } from './useTopTokens'
import {
  TopTokensQueryContext,
  TrendingTokensQueryContext
} from './watchlistQueriesContext'

/**
 * Context values must stay narrow and on tracked-props defaults (not
 * `notifyOnChangeProps: 'all'`) -- widening either re-opens the per-consumer
 * re-render fan-out this provider exists to close. The old per-call-site
 * `useIsFocused()` pause gate is deliberately not restored -- tracked as
 * CP-14922.
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

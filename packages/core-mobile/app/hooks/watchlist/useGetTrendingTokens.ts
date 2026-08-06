import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { useExchangeRates } from 'common/hooks/useExchangeRates'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useContext, useMemo } from 'react'
import { useSelector } from 'react-redux'
import WatchlistService from 'services/watchlist/WatchlistService'
import { selectSelectedCurrency } from 'store/settings/currency'
import { TrendingToken } from 'utils/api/types'
import { runAfterInteractions } from 'utils/runAfterInteractions'
import {
  TrendingTokensQueryContext,
  WatchlistQueryValue
} from './watchlistQueriesContext'

export const useTrendingTokensQuery = (): UseQueryResult<
  TrendingToken[],
  Error
> => {
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { data } = useExchangeRates()
  const exchangeRate = data?.usd?.[selectedCurrency.toLowerCase()]

  return useQuery({
    queryKey: [ReactQueryKeys.WATCHLIST_TRENDING_TOKENS, exchangeRate],
    queryFn: async () => {
      const tokens = await runAfterInteractions(async () => {
        return WatchlistService.getTrendingTokens(exchangeRate)
      })

      return tokens ?? []
    },
    refetchInterval: 120000 // 2 mins
    // CP-14918 fix-round-1: NOT `notifyOnChangeProps: 'all'` -- see the
    // detailed comment in useTopTokens.ts. Left at the v5 default so the
    // provider's `{ data, isLoading, isRefetching, refetch }` destructure
    // marks exactly those 4 fields tracked, and an isStale-only /
    // staleTime-elapsed transition doesn't reach the provider (let alone
    // its 20+ consumers).
  })
}

/**
 * Shared, deduped read of the trending-tokens query, with the same `select`
 * ergonomics the old per-call-site `useQuery({ select })` had. `select` is
 * applied locally (memoized on `[select, query.data]`, matching react-query's
 * own per-observer select memoization) rather than inside the shared
 * `useQuery` call, since a `select` baked into the single shared observer
 * would only ever serve whichever caller happened to render first.
 *
 * Must be called under <WatchlistQueriesProvider> (mounted once in
 * `(signedIn)/_layout.tsx`). Throws otherwise, rather than silently creating
 * a second observer.
 *
 * Returns a narrow `{ data, isLoading, isRefetching, refetch }` shape, not
 * the full `UseQueryResult` -- see the comment on `WatchlistQueryValue` in
 * watchlistQueriesContext.ts.
 */
export const useGetTrendingTokens = <TData = TrendingToken[]>(
  select?: (data: TrendingToken[]) => TData
): WatchlistQueryValue<TData> => {
  const query = useContext(TrendingTokensQueryContext)
  if (!query) {
    throw new Error(
      'useGetTrendingTokens() must be used within a <WatchlistQueriesProvider> (CP-14918: shared observer fix)'
    )
  }

  const data = useMemo(() => {
    if (!select) return query.data as unknown as TData
    return query.data !== undefined ? select(query.data) : undefined
  }, [select, query.data])

  return useMemo(
    () => ({
      data,
      isLoading: query.isLoading,
      isRefetching: query.isRefetching,
      refetch: query.refetch
    }),
    [data, query.isLoading, query.isRefetching, query.refetch]
  )
}

export const useGetTrendingToken = (
  internalId: string | undefined
): WatchlistQueryValue<TrendingToken | undefined> =>
  useGetTrendingTokens(data =>
    internalId ? data.find(token => token.internalId === internalId) : undefined
  )

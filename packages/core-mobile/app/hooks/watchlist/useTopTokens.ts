import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useContext } from 'react'
import { useSelector } from 'react-redux'
import WatchlistService from 'services/watchlist/WatchlistService'
import { selectSelectedCurrency } from 'store/settings/currency'
import { runAfterInteractions } from 'utils/runAfterInteractions'
import {
  TopTokensData,
  TopTokensQueryContext,
  WatchlistQueryValue
} from './watchlistQueriesContext'

export const useTopTokensQuery = (): UseQueryResult<TopTokensData, Error> => {
  const currency = useSelector(selectSelectedCurrency)

  return useQuery({
    queryKey: [ReactQueryKeys.WATCHLIST_TOP_TOKENS, currency],
    queryFn: () => {
      return runAfterInteractions(async () => {
        return WatchlistService.getTopTokens(currency)
      })
    },
    refetchInterval: 120000 // 2 minutes
    // Deliberately NOT `notifyOnChangeProps: 'all'` -- that would make any
    // tracked-irrelevant field flip (e.g. `isStale` on `staleTime` elapsing)
    // re-render every consumer of the shared observer. Left at the v5
    // default; context value below stays narrowed to
    // `{data, isLoading, isRefetching, refetch}` to match. CP-14918.
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

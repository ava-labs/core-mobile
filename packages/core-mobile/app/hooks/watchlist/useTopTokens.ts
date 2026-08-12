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
    // Deliberately NOT `notifyOnChangeProps: 'all'` -- that would re-render
    // every consumer of the shared observer on any tracked-irrelevant field
    // flip (e.g. `isStale` when `staleTime` elapses).
  })
}

export const useTopTokens = (): WatchlistQueryValue<TopTokensData> => {
  const query = useContext(TopTokensQueryContext)
  if (!query) {
    throw new Error(
      'useTopTokens() must be used within a <WatchlistQueriesProvider>'
    )
  }
  return query
}

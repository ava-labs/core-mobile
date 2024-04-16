import { addListener, isAnyOf } from '@reduxjs/toolkit'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { queryClient } from 'contexts/ReactQueryProvider'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import WatchlistService from 'services/watchlist/WatchlistService'
import { toggleDeveloperMode } from 'store/settings/advanced'
import { selectSelectedCurrency } from 'store/settings/currency'
import {
  TokensAndCharts,
  fetchWatchlist,
  selectWatchlistFavoriteIds
} from 'store/watchlist'

export const useGetTokensAndCharts = (): UseQueryResult<
  TokensAndCharts,
  Error
> => {
  const dispatch = useDispatch()
  const currency = useSelector(selectSelectedCurrency)
  const cachedFavoriteTokenIds = useSelector(selectWatchlistFavoriteIds)

  useEffect(() => {
    const unsubscribe = dispatch(
      addListener({
        matcher: isAnyOf(toggleDeveloperMode, fetchWatchlist),
        effect: async () => {
          await queryClient.invalidateQueries({
            queryKey: [ReactQueryKeys.WATCHLIST_TOKENS_AND_CHARTS]
          })
        }
      })
    )
    return () => {
      unsubscribe
    }
  }, [dispatch])

  return useQuery({
    queryKey: [
      ReactQueryKeys.WATCHLIST_TOKENS_AND_CHARTS,
      currency,
      cachedFavoriteTokenIds
    ],
    queryFn: () => WatchlistService.getTokens(currency, cachedFavoriteTokenIds),
    refetchInterval: 30000 // 30 seconds
  })
}

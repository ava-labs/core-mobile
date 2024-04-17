import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useSelector } from 'react-redux'
import WatchlistService from 'services/watchlist/WatchlistService'
import { selectSelectedCurrency } from 'store/settings/currency'
import { TokensAndCharts, selectWatchlistFavoriteIds } from 'store/watchlist'

export const useGetTokensAndCharts = (): UseQueryResult<
  TokensAndCharts,
  Error
> => {
  const currency = useSelector(selectSelectedCurrency)
  const cachedFavoriteTokenIds = useSelector(selectWatchlistFavoriteIds)

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

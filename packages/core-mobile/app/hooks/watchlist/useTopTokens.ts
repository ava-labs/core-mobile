import { useIsFocused } from '@react-navigation/native'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useSelector } from 'react-redux'
import WatchlistService from 'services/watchlist/WatchlistService'
import { selectSelectedCurrency } from 'store/settings/currency'
import { Charts, MarketToken, Prices } from 'store/watchlist'
import { runAfterInteractions } from 'utils/runAfterInteractions'

export const useTopTokens = (): UseQueryResult<
  { tokens: Record<string, MarketToken>; charts: Charts; prices: Prices },
  Error
> => {
  const currency = useSelector(selectSelectedCurrency)
  const isFocused = useIsFocused()

  return useQuery({
    enabled: isFocused,
    queryKey: [ReactQueryKeys.WATCHLIST_TOP_TOKENS, currency],
    queryFn: () => {
      return runAfterInteractions(async () => {
        return WatchlistService.getTopTokens(currency)
      })
    },
    refetchInterval: 120000 // 2 minutes
  })
}

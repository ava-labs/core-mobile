import { useIsFocused } from '@react-navigation/native'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useSelector } from 'react-redux'
import WatchlistService from 'services/watchlist/WatchlistService'
import { selectSelectedCurrency } from 'store/settings/currency'
import { TokensAndCharts } from 'store/watchlist'

export const useGetTokensAndCharts = (): UseQueryResult<
  TokensAndCharts,
  Error
> => {
  const currency = useSelector(selectSelectedCurrency)
  const isFocused = useIsFocused()

  return useQuery({
    enabled: isFocused,
    queryKey: [ReactQueryKeys.WATCHLIST_TOKENS_AND_CHARTS, currency],
    queryFn: () => WatchlistService.getTokens(currency),
    refetchInterval: 60000 // 1 minute
  })
}

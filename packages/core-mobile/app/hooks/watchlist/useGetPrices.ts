import { useIsFocused } from '@react-navigation/native'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useSelector } from 'react-redux'
import WatchlistService from 'services/watchlist/WatchlistService'
import { selectSelectedCurrency } from 'store/settings/currency'
import { Prices } from 'store/watchlist'

export const useGetPrices = (
  tokenIds: string[],
  shouldGetPrices = true
): UseQueryResult<Prices, Error> => {
  const currency = useSelector(selectSelectedCurrency).toLowerCase()
  const isFocused = useIsFocused()

  return useQuery({
    enabled: isFocused && tokenIds.length > 0 && shouldGetPrices,
    queryKey: [ReactQueryKeys.WATCHLIST_PRICES, currency, tokenIds],
    queryFn: () => WatchlistService.getPrices(tokenIds, currency),
    refetchInterval: 30000 // 30 seconds
  })
}

import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useSelector } from 'react-redux'
import WatchlistService from 'services/watchlist/WatchlistService'
import { selectSelectedCurrency } from 'store/settings/currency'
import { Prices } from 'store/watchlist'

export const useGetPrices = ({
  coingeckoIds,
  enabled
}: {
  coingeckoIds: string[]
  enabled: boolean
}): UseQueryResult<Prices, Error> => {
  const currency = useSelector(selectSelectedCurrency).toLowerCase()

  return useQuery({
    enabled,
    queryKey: [ReactQueryKeys.WATCHLIST_PRICES, currency, coingeckoIds],
    queryFn: () => WatchlistService.getPrices(coingeckoIds, currency),
    refetchInterval: 30000 // 30 seconds
  })
}

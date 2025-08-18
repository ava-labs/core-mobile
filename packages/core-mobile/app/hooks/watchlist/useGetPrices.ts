import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useSelector } from 'react-redux'
import WatchlistService from 'services/watchlist/WatchlistService'
import { selectSelectedCurrency } from 'store/settings/currency'
import { Prices } from 'store/watchlist'
import { runAfterInteractions } from 'utils/runAfterInteractions'

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
    queryFn: async () => {
      const prices = await runAfterInteractions(async () => {
        return WatchlistService.getPrices(coingeckoIds, currency)
      })

      return prices ?? {}
    },
    refetchInterval: 30000 // 30 seconds
  })
}

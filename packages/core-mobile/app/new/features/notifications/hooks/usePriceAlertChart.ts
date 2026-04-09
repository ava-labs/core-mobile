import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useSelector } from 'react-redux'
import TokenService from 'services/token/TokenService'
import { selectSelectedCurrency } from 'store/settings/currency'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import { ChartData } from 'services/token/types'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { AppNotification, isPriceAlertNotification } from '../types'

export function usePriceAlertChart(notification: AppNotification): {
  chartData: ChartData | undefined
  isLoading: boolean
} {
  const { getMarketTokenById } = useWatchlist()
  const currency = useSelector(selectSelectedCurrency)

  const tokenId = isPriceAlertNotification(notification)
    ? notification.data?.tokenId
    : undefined

  const coingeckoId = tokenId
    ? getMarketTokenById(tokenId)?.coingeckoId ?? undefined
    : undefined

  const to = Math.floor(notification.timestamp / 1000)
  const from = to - 24 * 60 * 60

  const { data, isLoading } = useQuery({
    queryKey: [
      ReactQueryKeys.PRICE_ALERT_CHART,
      coingeckoId,
      from,
      currency,
      to
    ],
    queryFn: () =>
      TokenService.getChartDataForCoinRange({
        coingeckoId: coingeckoId as string,
        from,
        to,
        currency: currency.toLowerCase() as VsCurrencyType
      }),
    enabled: !!coingeckoId,
    staleTime: Infinity // Chart data won't change, so we can set it to Infinity
  })

  return { chartData: data ?? undefined, isLoading: !!coingeckoId && isLoading }
}

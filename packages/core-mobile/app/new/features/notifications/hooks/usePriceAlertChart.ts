import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useSelector } from 'react-redux'
import TokenService from 'services/token/TokenService'
import { selectSelectedCurrency } from 'store/settings/currency'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import { ChartData } from 'services/token/types'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { AppNotification, isPriceAlertNotification } from '../types'

export function usePriceAlertChart(
  notification: AppNotification,
  delay = 0
): {
  chartData: ChartData | undefined
  isLoading: boolean
} {
  const { getMarketTokenById } = useWatchlist()
  const currency = useSelector(selectSelectedCurrency)

  // Stagger fetches to avoid bursting all chart requests simultaneously.
  // delay=0 starts immediately; positive values defer the fetch by that many ms.
  const [canFetch, setCanFetch] = useState(delay === 0)
  useEffect(() => {
    if (delay === 0) return
    const timer = setTimeout(() => setCanFetch(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

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
    enabled: !!coingeckoId && canFetch,
    staleTime: Infinity
  })

  return { chartData: data ?? undefined, isLoading: !!coingeckoId && isLoading }
}

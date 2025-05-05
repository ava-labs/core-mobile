import React, { useMemo } from 'react'
import {
  Charts,
  defaultChartData,
  MarketToken,
  selectIsWatchlistFavorite
} from 'store/watchlist'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { formatCurrency } from 'utils/FormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { PriceChangeStatus } from '@avalabs/k2-alpine'
import { isEffectivelyZero } from 'features/track/utils'
import { MarketGridView } from './MarketGridView'
import { MarketListView } from './MarketListView'

export const MarketListItem = ({
  token,
  charts,
  index,
  isGridView,
  onPress
}: {
  token: MarketToken
  charts: Charts
  index: number
  isGridView?: boolean
  onPress: () => void
}): React.JSX.Element => {
  const currency = useSelector(selectSelectedCurrency)

  const formattedPrice = useMemo(
    () =>
      token.currentPrice
        ? formatCurrency({
            amount: token.currentPrice,
            currency,
            boostSmallNumberPrecision: true
          })
        : UNKNOWN_AMOUNT,
    [currency, token.currentPrice]
  )

  const priceChange = token.priceChange24h ?? 0

  const formattedPriceChange = useMemo(() => {
    const absPriceChange = Math.abs(priceChange)

    // for effectively zero price changes, return undefined
    // this is to avoid displaying "0.00" in the price change column
    if (isEffectivelyZero(absPriceChange)) {
      return undefined
    }

    return formatCurrency({
      amount: Math.abs(priceChange),
      currency,
      boostSmallNumberPrecision: true
    })
  }, [currency, priceChange])

  const formattedPercent = useMemo(
    () =>
      token.priceChangePercentage24h
        ? Math.abs(token.priceChangePercentage24h)?.toFixed(2).toString() + '%'
        : undefined,
    [token.priceChangePercentage24h]
  )

  const status = priceChange
    ? priceChange > 0
      ? PriceChangeStatus.Up
      : priceChange < 0
      ? PriceChangeStatus.Down
      : PriceChangeStatus.Neutral
    : PriceChangeStatus.Neutral

  const isFavorite = useSelector(selectIsWatchlistFavorite(token.id))
  const chartData = charts[token.id] ?? defaultChartData

  return isGridView ? (
    <MarketGridView
      token={token}
      chartData={chartData}
      index={index}
      onPress={onPress}
      formattedPriceChange={formattedPriceChange}
      formattedPercentChange={formattedPercent}
      status={status}
      formattedPrice={formattedPrice}
      isFavorite={isFavorite}
    />
  ) : (
    <MarketListView
      token={token}
      index={index}
      onPress={onPress}
      formattedPriceChange={formattedPriceChange}
      formattedPercentChange={formattedPercent}
      status={status}
      formattedPrice={formattedPrice}
      isFavorite={isFavorite}
    />
  )
}

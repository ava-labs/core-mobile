import React from 'react'
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

  const formattedPrice = token.currentPrice
    ? formatCurrency({
        amount: token.currentPrice,
        currency,
        boostSmallNumberPrecision: true
      })
    : UNKNOWN_AMOUNT
  const priceChange = token.priceChange24h ?? 0
  const formattedPriceChange = formatCurrency({
    amount: Math.abs(priceChange),
    currency,
    boostSmallNumberPrecision: true
  })

  const formattedPercent = token.priceChangePercentage24h
    ? Math.abs(token.priceChangePercentage24h)?.toFixed(2).toString() + '%'
    : undefined

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

export default MarketListItem

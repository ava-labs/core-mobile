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
import MarketGridView from './MarketGridView'
import MarketListView from './MarketListView'

const MarketListItem = ({
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
  const percentChange = token.priceChangePercentage24h ?? undefined
  const priceChange = token.priceChange24h ?? undefined
  const formattedPriceChange = priceChange
    ? formatCurrency({
        amount: Math.abs(priceChange),
        currency,
        boostSmallNumberPrecision: true
      })
    : UNKNOWN_AMOUNT

  const formattedPercent = percentChange
    ? Math.abs(percentChange)?.toFixed(2).toString() + '%'
    : ''

  const status = priceChange
    ? priceChange > 0
      ? 'up'
      : priceChange < 0
      ? 'down'
      : 'equal'
    : 'equal'

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

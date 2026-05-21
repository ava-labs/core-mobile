import React from 'react'
import {
  Charts,
  defaultChartData,
  MarketToken,
  selectIsWatchlistFavorite
} from 'store/watchlist'
import { useSelector } from 'react-redux'
import { useTokenPriceDisplay } from 'common/hooks/useTokenPriceDisplay'
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
  const { formattedPrice, formattedPriceChange, formattedPercent, status } =
    useTokenPriceDisplay({
      currentPrice: token.currentPrice,
      priceChange24h: token.priceChange24h,
      priceChangePercentage24h: token.priceChangePercentage24h
    })

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
      onPress={onPress}
      formattedPriceChange={formattedPriceChange}
      formattedPercentChange={formattedPercent}
      status={status}
      formattedPrice={formattedPrice}
      isFavorite={isFavorite}
    />
  )
}

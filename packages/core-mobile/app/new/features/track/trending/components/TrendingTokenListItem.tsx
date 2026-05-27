import React from 'react'
import { MarketToken, selectIsWatchlistFavorite } from 'store/watchlist'
import { useSelector } from 'react-redux'
import { useTokenPriceDisplay } from 'common/hooks/useTokenPriceDisplay'
import { TrendingTokenListView } from './TrendingTokenListView'

export const TrendingTokenListItem = ({
  token,
  index,
  onPress,
  onBuyPress,
  showBuyButton
}: {
  token: MarketToken
  index: number
  onPress: () => void
  onBuyPress: () => void
  showBuyButton: boolean
}): React.JSX.Element => {
  const { formattedPrice, formattedPercent, status } = useTokenPriceDisplay({
    currentPrice: token.currentPrice,
    priceChange24h: token.priceChange24h,
    priceChangePercentage24h: token.priceChangePercentage24h
  })

  const isFavorite = useSelector(selectIsWatchlistFavorite(token.id))

  return (
    <TrendingTokenListView
      token={token}
      index={index}
      onPress={onPress}
      formattedPercentChange={formattedPercent}
      status={status}
      formattedPrice={formattedPrice}
      isFavorite={isFavorite}
      onBuyPress={onBuyPress}
      showBuyButton={showBuyButton}
    />
  )
}

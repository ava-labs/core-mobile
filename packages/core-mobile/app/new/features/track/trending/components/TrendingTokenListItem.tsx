import React, { useMemo } from 'react'
import { MarketToken, selectIsWatchlistFavorite } from 'store/watchlist'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { formatCurrency } from 'utils/FormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { PriceChangeStatus } from '@avalabs/k2-alpine'
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

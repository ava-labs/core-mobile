import { PriceChangeStatus } from '@avalabs/k2-alpine'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'
import React, { useRef, useCallback } from 'react'
import { LocalTokenWithBalance } from 'store/balance'
import { TokenGridView } from './TokenGridView'
import { TokenListView } from './TokenListView'

interface TokenListItemProps {
  token: LocalTokenWithBalance
  index: number
  isGridView?: boolean
  onPress: () => void
}

export const TokenListItem = ({
  token,
  index,
  isGridView,
  onPress
}: TokenListItemProps): React.JSX.Element => {
  const { getMarketTokenBySymbol } = useWatchlist()
  const { formatCurrency } = useFormatCurrency()
  const { balanceInCurrency, symbol } = token
  const formattedBalance = balanceInCurrency
    ? formatCurrency({ amount: balanceInCurrency })
    : ''

  const marketToken = getMarketTokenBySymbol(symbol)
  const percentChange = marketToken?.priceChangePercentage24h ?? undefined
  const priceChange =
    percentChange && balanceInCurrency
      ? (balanceInCurrency * percentChange) / 100
      : undefined
  const formattedPrice = priceChange
    ? formatCurrency({ amount: Math.abs(priceChange) })
    : UNKNOWN_AMOUNT

  const status = priceChange
    ? priceChange > 0
      ? PriceChangeStatus.Up
      : priceChange < 0
      ? PriceChangeStatus.Down
      : PriceChangeStatus.Neutral
    : PriceChangeStatus.Neutral

  const isPressDisabledRef = useRef(false)

  const handlePress = useCallback(() => {
    // Prevent multiple presses
    if (isPressDisabledRef.current) return

    // Disable further presses
    isPressDisabledRef.current = true

    onPress()

    // Re-enable after 300ms
    setTimeout(() => {
      isPressDisabledRef.current = false
    }, 300)
  }, [onPress])

  return isGridView ? (
    <TokenGridView
      token={token}
      index={index}
      onPress={handlePress}
      priceChangeStatus={status}
      formattedBalance={formattedBalance}
      formattedPrice={formattedPrice}
    />
  ) : (
    <TokenListView
      token={token}
      index={index}
      onPress={handlePress}
      priceChangeStatus={status}
      formattedBalance={formattedBalance}
      formattedPrice={formattedPrice}
    />
  )
}

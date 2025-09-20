import { PriceChangeStatus } from '@avalabs/k2-alpine'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'
import React, { useRef, useCallback } from 'react'
import { LocalTokenWithBalance } from 'store/balance'
import { useMarketTokenBySymbol } from 'common/hooks/useMarketTokenBySymbol'
import { useTokenNameForDisplay } from 'common/hooks/useTokenNameForDisplay'
import { TokenListView } from './TokenListView'
import { TokenGridView } from './TokenGridView'

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
  const { formatCurrency } = useFormatCurrency()
  const { balanceInCurrency, symbol } = token
  const formattedBalance = balanceInCurrency
    ? formatCurrency({ amount: balanceInCurrency })
    : undefined

  const tokenNameForDisplay = useTokenNameForDisplay({ token }) ?? token.name

  const marketToken = useMarketTokenBySymbol({
    symbol,
    errorContext: 'TokenListItem'
  })
  const percentChange = marketToken?.priceChangePercentage24h ?? undefined
  const priceChange =
    percentChange !== undefined && balanceInCurrency !== undefined
      ? (balanceInCurrency * percentChange) / 100
      : undefined
  const formattedPrice =
    priceChange !== undefined
      ? formatCurrency({ amount: Math.abs(priceChange) })
      : undefined

  const status =
    priceChange !== undefined
      ? priceChange > 0
        ? PriceChangeStatus.Up
        : priceChange < 0
        ? PriceChangeStatus.Down
        : PriceChangeStatus.Neutral
      : undefined

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
      tokenNameForDisplay={tokenNameForDisplay}
      index={index}
      onPress={handlePress}
      priceChangeStatus={status}
      formattedBalance={formattedBalance}
      formattedPrice={formattedPrice}
    />
  ) : (
    <TokenListView
      token={token}
      tokenNameForDisplay={tokenNameForDisplay}
      index={index}
      onPress={handlePress}
      priceChangeStatus={status}
      formattedBalance={formattedBalance}
      formattedPrice={formattedPrice}
    />
  )
}

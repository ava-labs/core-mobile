import React from 'react'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { LocalTokenWithBalance } from 'store/balance'
import { PriceChangeStatus } from '@avalabs/k2-alpine'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'
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
  const { balanceDisplayValue, balanceInCurrency, symbol } = token
  const formattedBalance = balanceInCurrency
    ? formatCurrency({ amount: balanceInCurrency })
    : `${balanceDisplayValue} ${symbol}`

  const marketToken = getMarketTokenBySymbol(symbol)
  const percentChange = marketToken?.priceChangePercentage24h ?? undefined
  const priceChange =
    percentChange && balanceInCurrency
      ? (balanceInCurrency * percentChange) / 100
      : 0
  const formattedPrice = '$' + Math.abs(priceChange)?.toFixed(2).toString()

  const status = priceChange
    ? priceChange > 0
      ? PriceChangeStatus.Up
      : priceChange < 0
      ? PriceChangeStatus.Down
      : PriceChangeStatus.Neutral
    : PriceChangeStatus.Neutral

  return isGridView ? (
    <TokenGridView
      token={token}
      index={index}
      onPress={onPress}
      priceChangeStatus={status}
      formattedBalance={formattedBalance}
      formattedPrice={formattedPrice}
    />
  ) : (
    <TokenListView
      token={token}
      index={index}
      onPress={onPress}
      priceChangeStatus={status}
      formattedBalance={formattedBalance}
      formattedPrice={formattedPrice}
    />
  )
}

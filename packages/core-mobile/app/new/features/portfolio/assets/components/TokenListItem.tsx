import { useApplicationContext } from 'contexts/ApplicationContext'
import React from 'react'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { LocalTokenWithBalance } from 'store/balance'
import { UNKNOWN_AMOUNT } from 'consts/amount'
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
  const {
    appHook: { currencyFormatter }
  } = useApplicationContext()
  const { getMarketTokenBySymbol } = useWatchlist()

  const { balanceDisplayValue, balanceInCurrency, symbol } = token
  const formattedBalance = balanceInCurrency
    ? currencyFormatter(balanceInCurrency)
    : `${balanceDisplayValue} ${symbol}`

  const marketToken = getMarketTokenBySymbol(symbol)
  const percentChange = marketToken?.priceChangePercentage24h ?? undefined
  const priceChange =
    percentChange && balanceInCurrency
      ? (balanceInCurrency * percentChange) / 100
      : undefined
  const formattedPrice = priceChange
    ? Math.abs(priceChange)?.toFixed(2).toString()
    : UNKNOWN_AMOUNT
  const status = priceChange
    ? priceChange > 0
      ? 'up'
      : priceChange < 0
      ? 'down'
      : 'equal'
    : 'equal'

  return isGridView ? (
    <TokenGridView
      token={token}
      index={index}
      onPress={onPress}
      status={status}
      formattedBalance={formattedBalance}
      formattedPrice={formattedPrice}
    />
  ) : (
    <TokenListView
      token={token}
      index={index}
      onPress={onPress}
      status={status}
      formattedBalance={formattedBalance}
      formattedPrice={formattedPrice}
    />
  )
}

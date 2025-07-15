import { PriceChangeStatus } from '@avalabs/k2-alpine'
import { Transaction, TransactionType } from '@avalabs/vm-module-types'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import React, { FC, useMemo } from 'react'
import { ActivityTransactionType } from 'store/transaction'
import ActivityListItem from './ActivityListItem'
import { TokenActivityListItemTitle } from './TokenActivityListItemTitle'
import { TransactionIconWithTokenLogo } from './TransactionIconWithTokenLogo'

export const TokenActivityListItem: FC<Props> = ({
  tx,
  showTokenLogo,
  onPress
}) => {
  const { formatCurrency } = useFormatCurrency()
  const { getMarketTokenBySymbol } = useWatchlist()

  const token = getMarketTokenBySymbol(tx.tokens[0]?.symbol ?? '')

  const currentPrice = tx.tokens[0]?.symbol
    ? getMarketTokenBySymbol(tx.tokens[0].symbol)?.currentPrice
    : undefined

  const status = useMemo(() => {
    switch (tx.txType) {
      case TransactionType.TRANSFER:
      case TransactionType.SEND:
        return PriceChangeStatus.Down
      case TransactionType.RECEIVE:
        return PriceChangeStatus.Up
      default:
        return PriceChangeStatus.Neutral
    }
  }, [tx.txType])

  const formattedAmountInCurrency = useMemo(() => {
    const amount = Number(tx.tokens[0]?.amount.replaceAll(',', ''))
    if (!currentPrice || isNaN(amount)) {
      return UNKNOWN_AMOUNT
    }
    const amountInCurrency = amount * currentPrice

    const formattedAmount = formatCurrency({
      amount: amountInCurrency
    })
    const amountPrefix =
      status === PriceChangeStatus.Up
        ? '+'
        : status === PriceChangeStatus.Down
        ? '-'
        : ''
    return amountPrefix + formattedAmount
  }, [status, currentPrice, tx.tokens, formatCurrency])

  return (
    <ActivityListItem
      title={<TokenActivityListItemTitle tx={tx} />}
      subtitle={formattedAmountInCurrency}
      subtitleType="amountInCurrency"
      timestamp={tx.timestamp}
      icon={
        <TransactionIconWithTokenLogo
          tx={tx}
          token={token}
          showTokenLogo={showTokenLogo}
        />
      }
      onPress={onPress}
      status={status}
    />
  )
}

export type TokenActivityTransaction = Omit<Transaction, 'txType'> & {
  txType: ActivityTransactionType
}

type Props = {
  tx: TokenActivityTransaction
  index: number
  showTokenLogo?: boolean
  onPress?: () => void
}

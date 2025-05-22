import React, { FC, useMemo } from 'react'
import { ActivityTransactionType } from 'store/transaction'
import { TransactionType, Transaction } from '@avalabs/vm-module-types'
import { useTheme, View, PriceChangeStatus } from '@avalabs/k2-alpine'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import ActivityListItem from './ActivityListItem'
import { TransactionTypeIcon } from './TransactionTypeIcon'
import { TokenActivityListItemTitle } from './TokenActivityListItemTitle'

export const TokenActivityListItem: FC<Props> = ({ tx, onPress }) => {
  const {
    theme: { colors }
  } = useTheme()
  const { formatCurrency } = useFormatCurrency()
  const { getMarketTokenBySymbol } = useWatchlist()

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
      icon={
        <View
          sx={{
            width: ICON_SIZE,
            height: ICON_SIZE,
            borderRadius: ICON_SIZE,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            backgroundColor: colors.$borderPrimary,
            borderColor: colors.$borderPrimary
          }}>
          <TransactionTypeIcon
            txType={tx.txType}
            isContractCall={tx.isContractCall}
          />
        </View>
      }
      onPress={onPress}
      status={status}
    />
  )
}

const ICON_SIZE = 36

export type TokenActivityTransaction = Omit<Transaction, 'txType'> & {
  txType: ActivityTransactionType
}

type Props = {
  tx: TokenActivityTransaction
  index: number
  onPress?: () => void
}

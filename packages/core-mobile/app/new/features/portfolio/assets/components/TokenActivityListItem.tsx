import { PriceChangeStatus, useTheme, View } from '@avalabs/k2-alpine'
import { Transaction, TransactionType } from '@avalabs/vm-module-types'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import React, { FC, useMemo } from 'react'
import { ActivityTransactionType } from 'store/transaction'
import ActivityListItem from './ActivityListItem'
import { TokenActivityListItemTitle } from './TokenActivityListItemTitle'
import { TransactionTypeIcon } from './TransactionTypeIcon'

export const TokenActivityListItem: FC<Props> = ({
  tx,
  onPress,
  showSeparator
}) => {
  const {
    theme: { colors }
  } = useTheme()
  const { formatTokenInCurrency } = useFormatCurrency()
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
      case TransactionType.SWAP: {
        if (tx.isIncoming) {
          return PriceChangeStatus.Up
        }
        if (tx.isOutgoing) {
          return PriceChangeStatus.Down
        }
        if (tx.tokens.length === 1) {
          return PriceChangeStatus.Down
        }

        return PriceChangeStatus.Up
      }
      default: {
        return PriceChangeStatus.Neutral
      }
    }
  }, [tx.isIncoming, tx.isOutgoing, tx.tokens.length, tx.txType])

  const formattedAmountInCurrency = useMemo(() => {
    const amount = Number(tx.tokens[0]?.amount.replaceAll(',', ''))
    if (!currentPrice || isNaN(amount)) {
      return null
    }
    const amountInCurrency = amount * currentPrice

    const formattedAmount = formatTokenInCurrency({
      amount: amountInCurrency
    })
    const amountPrefix =
      status === PriceChangeStatus.Up
        ? '+'
        : status === PriceChangeStatus.Down
        ? '-'
        : ''
    return amountPrefix + formattedAmount
  }, [status, currentPrice, tx.tokens, formatTokenInCurrency])

  const renderIcon = useMemo(() => {
    return (
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
    )
  }, [tx, colors.$borderPrimary])

  return (
    <ActivityListItem
      title={<TokenActivityListItemTitle tx={tx} />}
      subtitle={formattedAmountInCurrency}
      subtitleType="amountInCurrency"
      timestamp={tx.timestamp}
      showSeparator={showSeparator}
      icon={renderIcon}
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
  showSeparator: boolean
}

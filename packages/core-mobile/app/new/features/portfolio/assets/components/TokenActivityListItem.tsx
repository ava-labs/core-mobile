import React, { FC, useMemo } from 'react'
import { ActivityTransactionType } from 'store/transaction'
import { TransactionType, Transaction } from '@avalabs/vm-module-types'
import { useTheme, View, PriceChangeStatus } from '@avalabs/k2-alpine'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { formatCurrency } from 'utils/FormatCurrency'
import { useBlockchainNames } from 'screens/activity/hooks/useBlockchainNames'
import ActivityListItem from './ActivityListItem'
import { TransactionTypeIcon } from './TransactionTypeIcon'

const ICON_SIZE = 36

type Props = {
  tx: Omit<Transaction, 'txType'> & { txType: ActivityTransactionType }
  index: number
  onPress?: () => void
}

export const TokenActivityListItem: FC<Props> = ({ tx, onPress, index }) => {
  const {
    theme: { colors }
  } = useTheme()
  const { getMarketTokenBySymbol } = useWatchlist()
  const { sourceBlockchain, targetBlockchain } = useBlockchainNames(tx)

  const currency = useSelector(selectSelectedCurrency)
  const currentPrice = tx.tokens[0]?.symbol
    ? getMarketTokenBySymbol(tx.tokens[0].symbol)?.currentPrice
    : undefined

  const title = useMemo(() => {
    switch (tx.txType) {
      case TransactionType.BRIDGE:
        return `${sourceBlockchain ?? 'Unknown'} → ${
          targetBlockchain ?? 'Unknown'
        }`
      case TransactionType.SWAP:
        return `${tx.tokens[0]?.amount ?? UNKNOWN_AMOUNT} ${
          tx.tokens[0]?.symbol
        } swapped for ${tx.tokens[1]?.symbol ?? UNKNOWN_AMOUNT}`
      case TransactionType.SEND:
        return `${tx.tokens[0]?.amount ?? UNKNOWN_AMOUNT} ${
          tx.tokens[0]?.symbol
        } sent`
      case TransactionType.RECEIVE:
        return `${tx.tokens[0]?.amount ?? UNKNOWN_AMOUNT} ${
          tx.tokens[0]?.symbol
        } received`
      case TransactionType.TRANSFER:
        return `${tx.tokens[0]?.amount ?? UNKNOWN_AMOUNT} ${
          tx.tokens[0]?.symbol
        } transferred`
      default:
        if (tx.isContractCall) {
          return tx.tokens.length > 1
            ? `${tx.tokens[0]?.amount ?? UNKNOWN_AMOUNT} ${
                tx.tokens[0]?.symbol
              } swapped for ${tx.tokens[1]?.symbol ?? UNKNOWN_AMOUNT}`
            : 'Contract Call'
        }
        return 'Unknown'
    }
  }, [tx, sourceBlockchain, targetBlockchain])

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

  const subtitle = useMemo(() => {
    if (!currentPrice || isNaN(Number(tx.tokens[0]?.amount))) {
      return UNKNOWN_AMOUNT
    }
    const amountInCurrency = Number(tx.tokens[0]?.amount) * currentPrice

    const formattedAmount = formatCurrency({
      amount: amountInCurrency,
      currency,
      boostSmallNumberPrecision: true
    })
    const amountPrefix =
      status === PriceChangeStatus.Up
        ? '+'
        : status === PriceChangeStatus.Down
        ? '-'
        : ''
    return amountPrefix + formattedAmount + ' ' + currency
  }, [status, currency, currentPrice, tx.tokens])

  return (
    <ActivityListItem
      title={title}
      subtitle={subtitle}
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
      index={index}
      status={status}
    />
  )
}

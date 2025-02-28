import React, { FC, useMemo } from 'react'
import { ActivityTransactionType } from 'store/transaction'
import { TransactionType, Transaction } from '@avalabs/vm-module-types'
import { useTheme, alpha, View } from '@avalabs/k2-alpine'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { formatCurrency } from 'utils/FormatCurrency'
import { AmountIndicator } from 'common/types'
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
    theme: { colors, isDark }
  } = useTheme()
  const { getMarketToken } = useWatchlist()
  const { sourceBlockchain, targetBlockchain } = useBlockchainNames(tx)

  const currency = useSelector(selectSelectedCurrency)
  const currentPrice = tx.tokens[0]?.symbol
    ? getMarketToken(tx.tokens[0].symbol)?.currentPrice
    : undefined
  const borderColor = isDark ? colors.$borderPrimary : alpha('#000000', 0.15)
  const backgroundColor = colors.$borderPrimary

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

  const amountIndicator = useMemo(() => {
    switch (tx.txType) {
      case TransactionType.TRANSFER:
      case TransactionType.SEND:
        return AmountIndicator.Down
      case TransactionType.RECEIVE:
        return AmountIndicator.Up
      default:
        return AmountIndicator.Neutral
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
      amountIndicator === AmountIndicator.Up
        ? '+'
        : amountIndicator === AmountIndicator.Down
        ? '-'
        : ''
    return amountPrefix + formattedAmount + ' ' + currency
  }, [amountIndicator, currency, currentPrice, tx.tokens])

  const transactionTypeIcon = useMemo(() => {
    return (
      <View
        sx={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          borderRadius: ICON_SIZE,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          backgroundColor,
          borderColor
        }}>
        <TransactionTypeIcon
          txType={tx.txType}
          isContractCall={tx.isContractCall}
        />
      </View>
    )
  }, [backgroundColor, borderColor, tx.isContractCall, tx.txType])

  return (
    <ActivityListItem
      title={title}
      subtitle={subtitle}
      icon={transactionTypeIcon}
      onPress={onPress}
      index={index}
      amountIndicator={amountIndicator}
    />
  )
}

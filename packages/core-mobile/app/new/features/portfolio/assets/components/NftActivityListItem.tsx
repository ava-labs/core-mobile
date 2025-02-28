import React, { FC, useMemo } from 'react'
import { TransactionType } from '@avalabs/vm-module-types'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { formatCurrency } from 'utils/FormatCurrency'
import { Transaction } from 'store/transaction'
import { AmountIndicator } from 'common/types'
import { alpha, Icons, useTheme, View } from '@avalabs/k2-alpine'
import ActivityListItem from './ActivityListItem'

const ICON_SIZE = 36

type Props = {
  tx: Transaction
  index: number
  onPress?: () => void
}

export const NftActivityListItem: FC<Props> = ({ tx, onPress, index }) => {
  const {
    theme: { colors, isDark }
  } = useTheme()
  const borderColor = isDark ? colors.$borderPrimary : alpha('#000000', 0.15)
  const backgroundColor = colors.$borderPrimary
  const { getMarketToken } = useWatchlist()

  const currency = useSelector(selectSelectedCurrency)
  const currentPrice = tx.tokens[0]?.symbol
    ? getMarketToken(tx.tokens[0].symbol)?.currentPrice
    : undefined

  const title = useMemo(() => {
    switch (tx.txType) {
      case TransactionType.NFT_BUY:
        return `${tx.tokens[0]?.amount} ${tx.tokens[0]?.symbol} spent on ${tx.tokens[0]?.name}`
      case TransactionType.NFT_SEND:
        return `${tx.tokens[0]?.name} sent`
      case TransactionType.NFT_RECEIVE:
        return `${tx.tokens[0]?.name} received`
      default:
        return 'Unknown'
    }
  }, [tx.tokens, tx.txType])

  const amountIndicator = useMemo(() => {
    switch (tx.txType) {
      case TransactionType.NFT_RECEIVE:
        return AmountIndicator.Up
      case TransactionType.NFT_BUY:
      case TransactionType.NFT_SEND:
        return AmountIndicator.Down
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
          borderRadius: 10,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          backgroundColor,
          borderColor
        }}>
        <Icons.Custom.SignPost width={14} height={14} />
      </View>
    )
  }, [backgroundColor, borderColor])

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

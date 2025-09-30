import { alpha, PriceChangeStatus, useTheme, View } from '@avalabs/k2-alpine'
import {
  PChainTransactionType,
  TransactionType
} from '@avalabs/vm-module-types'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useMarketTokenBySymbol } from 'common/hooks/useMarketTokenBySymbol'
import React, { FC, useMemo } from 'react'
import { Transaction } from 'store/transaction'
import ActivityListItem from './ActivityListItem'
import { TransactionTypeIcon } from './TransactionTypeIcon'
import { XPTokenActivityListItemTitle } from './XPTokenActivityListItemTitle'

const ICON_SIZE = 36

type Props = {
  tx: Transaction
  index: number
  onPress?: () => void
  showSeparator: boolean
}

export const XpActivityListItem: FC<Props> = ({
  tx,
  onPress,
  showSeparator
}) => {
  const {
    theme: { isDark, colors }
  } = useTheme()
  const borderColor = isDark ? colors.$borderPrimary : alpha('#000000', 0.15)
  const backgroundColor = colors.$borderPrimary
  const { formatTokenInCurrency } = useFormatCurrency()
  const currentPrice = useMarketTokenBySymbol({
    symbol: tx.tokens[0]?.symbol
  })?.currentPrice

  const txType = useMemo(() => {
    if (tx.txType === PChainTransactionType.BASE_TX) {
      if (tx.isIncoming) return TransactionType.RECEIVE
      if (tx.isOutgoing) return TransactionType.SEND
    }

    return tx.txType
  }, [tx])

  const status = useMemo(() => {
    if (tx.txType === PChainTransactionType.BASE_TX) {
      if (tx.isIncoming) {
        return PriceChangeStatus.Up
      }
      if (tx.isOutgoing) {
        return PriceChangeStatus.Down
      }
    }

    return PriceChangeStatus.Neutral
  }, [tx])

  const formattedAmountInCurrency = useMemo(() => {
    const amount = Number(tx.tokens[0]?.amount.replaceAll(',', ''))
    if (!currentPrice || isNaN(amount)) {
      return null
    }
    const amountInCurrency = amount * currentPrice

    return formatTokenInCurrency({
      amount: amountInCurrency
    })
  }, [currentPrice, tx.tokens, formatTokenInCurrency])

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
          txType={txType}
          isContractCall={tx.isContractCall}
        />
      </View>
    )
  }, [backgroundColor, borderColor, tx.isContractCall, txType])

  return (
    <ActivityListItem
      title={<XPTokenActivityListItemTitle tx={tx} />}
      subtitle={formattedAmountInCurrency}
      subtitleType="amountInToken"
      icon={transactionTypeIcon}
      onPress={onPress}
      status={status}
      timestamp={tx.timestamp}
      showSeparator={showSeparator}
    />
  )
}

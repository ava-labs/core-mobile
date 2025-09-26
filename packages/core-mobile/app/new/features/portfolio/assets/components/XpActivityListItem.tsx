import { alpha, PriceChangeStatus, useTheme, View } from '@avalabs/k2-alpine'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import React, { FC, useMemo } from 'react'
import { Transaction } from 'store/transaction'
import { useMarketTokenBySymbol } from 'common/hooks/useMarketTokenBySymbol'
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
          txType={tx.txType}
          isContractCall={tx.isContractCall}
        />
      </View>
    )
  }, [backgroundColor, borderColor, tx.isContractCall, tx.txType])

  return (
    <ActivityListItem
      title={<XPTokenActivityListItemTitle tx={tx} />}
      subtitle={formattedAmountInCurrency}
      subtitleType="amountInToken"
      icon={transactionTypeIcon}
      onPress={onPress}
      status={PriceChangeStatus.Neutral}
      timestamp={tx.timestamp}
      showSeparator={showSeparator}
    />
  )
}

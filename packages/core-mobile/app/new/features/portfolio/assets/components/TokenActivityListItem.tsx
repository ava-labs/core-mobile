import { PriceChangeStatus, useTheme, View } from '@avalabs/k2-alpine'
import { TransactionType } from '@avalabs/vm-module-types'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import {
  isCollectibleTransaction,
  isPotentiallySwap
} from 'features/activity/utils'
import { CollectibleFetchAndRender } from 'features/portfolio/collectibles/components/CollectibleFetchAndRender'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import React, { FC, useMemo } from 'react'
import { ActivityTransactionType, Transaction } from 'store/transaction'
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
        return PriceChangeStatus.Neutral
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
        if (isCollectibleTransaction(tx)) {
          return PriceChangeStatus.Neutral
        }
        if (tx.isContractCall) {
          return tx.isSender ? PriceChangeStatus.Down : PriceChangeStatus.Up
        }
        return PriceChangeStatus.Neutral
      }
    }
  }, [tx])

  const subtitle = useMemo(() => {
    if (isCollectibleTransaction(tx)) {
      return `#${
        tx.tokens[0]?.collectableTokenId || tx.tokens[1]?.collectableTokenId
      } - ${tx?.tokens[0]?.type}`
    }

    if (tx.txType === TransactionType.TRANSFER) {
      return `${tx.tokens[0]?.name}`
    }

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
  }, [tx, currentPrice, formatTokenInCurrency, status])

  const renderIcon = useMemo(() => {
    if (isCollectibleTransaction(tx)) {
      return (
        <CollectibleFetchAndRender tx={tx} size={ICON_SIZE} iconSize={20} />
      )
    }

    const txType = fixUnknownTxType(tx)

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
          txType={txType}
          isContractCall={tx.isContractCall}
        />
      </View>
    )
  }, [tx, colors.$borderPrimary])

  return (
    <ActivityListItem
      title={<TokenActivityListItemTitle tx={tx} />}
      subtitle={subtitle}
      subtitleType="amountInCurrency"
      timestamp={tx.timestamp}
      showSeparator={showSeparator}
      icon={renderIcon}
      onPress={onPress}
      status={status}
    />
  )
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export function fixUnknownTxType(tx: Transaction): ActivityTransactionType {
  if (tx?.txType === TransactionType.UNKNOWN) {
    if (tx.tokens.length === 1) {
      if (isPotentiallySwap(tx)) {
        return TransactionType.SWAP
      }
      return tx.isSender ? TransactionType.SEND : TransactionType.RECEIVE
    }
    if (tx.tokens.length > 1) {
      if (tx.tokens[0]?.symbol === tx.tokens[1]?.symbol) {
        return tx.isSender ? TransactionType.SEND : TransactionType.RECEIVE
      }
      return TransactionType.SWAP
    }
  }
  return tx.txType as ActivityTransactionType
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

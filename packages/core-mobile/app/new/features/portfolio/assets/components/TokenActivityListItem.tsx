import React, { FC, ReactNode, useCallback, useMemo } from 'react'
import { ActivityTransactionType } from 'store/transaction'
import { TransactionType, Transaction } from '@avalabs/vm-module-types'
import { useTheme, View, PriceChangeStatus, Text } from '@avalabs/k2-alpine'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useBlockchainNames } from 'common/utils/useBlockchainNames'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { SubTextNumber } from 'common/components/SubTextNumber'
import ActivityListItem from './ActivityListItem'
import { TransactionTypeIcon } from './TransactionTypeIcon'

const ICON_SIZE = 36

type TokenActivityTransaction = Omit<Transaction, 'txType'> & {
  txType: ActivityTransactionType
}

type Props = {
  tx: TokenActivityTransaction
  index: number
  onPress?: () => void
}

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

  const subtitle = useMemo(() => {
    if (!currentPrice || isNaN(Number(tx.tokens[0]?.amount))) {
      return UNKNOWN_AMOUNT
    }
    const amountInCurrency = Number(tx.tokens[0]?.amount) * currentPrice

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
      title={<TitleComponent tx={tx} />}
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
      status={status}
    />
  )
}

const TitleComponent = ({
  tx
}: {
  tx: TokenActivityTransaction
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { sourceBlockchain, targetBlockchain } = useBlockchainNames(tx)

  const renderAmount = useCallback(
    (amount?: string): ReactNode => {
      const num = Number(amount)
      if (!isNaN(num)) {
        return (
          <SubTextNumber
            key={`amt-${amount}`}
            number={num}
            textColor={colors.$textPrimary}
            textSize={15}
            subTextSize={12}
          />
        )
      }
      return amount ?? UNKNOWN_AMOUNT
    },
    [colors]
  )

  // Build an array of nodes: strings and React elements
  const nodes = useMemo<ReactNode[]>(() => {
    const a1 = tx.tokens[0]?.amount
    const s1 = tx.tokens[0]?.symbol ?? UNKNOWN_AMOUNT
    const s2 = tx.tokens[1]?.symbol

    switch (tx.txType) {
      case TransactionType.BRIDGE:
        return [
          sourceBlockchain ?? 'Unknown',
          ' → ',
          targetBlockchain ?? 'Unknown'
        ]

      case TransactionType.SWAP:
        return [
          renderAmount(a1),
          ' ',
          s1,
          ' swapped for ',
          s2 ?? UNKNOWN_AMOUNT
        ]

      case TransactionType.SEND:
        return [renderAmount(a1), ' ', s1, ' sent']

      case TransactionType.RECEIVE:
        return [renderAmount(a1), ' ', s1, ' received']

      case TransactionType.TRANSFER:
        return [renderAmount(a1), ' ', s1, ' transferred']

      default:
        if (tx.isContractCall) {
          if (tx.tokens.length > 1) {
            return [
              renderAmount(a1),
              ' ',
              s1,
              ' swapped for ',
              s2 ?? UNKNOWN_AMOUNT
            ]
          }
          return ['Contract Call']
        }
        return ['Unknown']
    }
  }, [tx, sourceBlockchain, targetBlockchain, renderAmount])

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        flexWrap: 'wrap'
      }}>
      {nodes.map((node, i) =>
        typeof node === 'string' ? (
          <Text
            key={`txt-${i}`}
            variant="body1"
            sx={{ color: colors.$textPrimary }}>
            {node}
          </Text>
        ) : React.isValidElement(node) ? (
          React.cloneElement(node, { key: `node-${i}` })
        ) : null
      )}
    </View>
  )
}

export default TitleComponent

import React, { ReactNode, useCallback, useMemo } from 'react'
import { TransactionType } from '@avalabs/vm-module-types'
import { useTheme, View, Text } from '@avalabs/k2-alpine'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useBlockchainNames } from 'common/utils/useBlockchainNames'
import { SubTextNumber } from 'common/components/SubTextNumber'
import { TokenActivityTransaction } from './TokenActivityListItem'

export const TokenActivityListItemTitle = ({
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

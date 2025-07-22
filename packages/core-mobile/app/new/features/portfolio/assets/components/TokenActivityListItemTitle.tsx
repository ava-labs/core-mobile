import { Text, useTheme, View } from '@avalabs/k2-alpine'
import { TransactionType } from '@avalabs/vm-module-types'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { SubTextNumber } from 'common/components/SubTextNumber'
import { useBlockchainNames } from 'common/utils/useBlockchainNames'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useNetworks } from 'hooks/networks/useNetworks'
import React, { ReactNode, useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
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
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const textVariant = 'buttonMedium'
  const { getNetwork } = useNetworks()

  const renderAmount = useCallback(
    (amount?: string): ReactNode => {
      if (isPrivacyModeEnabled) {
        return <HiddenBalanceText variant={textVariant} isCurrency={false} />
      }

      const num = Number(amount)
      if (!isNaN(num)) {
        return (
          <SubTextNumber
            key={`amt-${amount}`}
            number={num}
            textVariant={textVariant}
            textColor={colors.$textPrimary}
          />
        )
      }
      return amount ?? UNKNOWN_AMOUNT
    },
    [colors, isPrivacyModeEnabled]
  )

  // Build an array of nodes: strings and React elements
  const nodes = useMemo<ReactNode[]>(() => {
    const a1 = tx.tokens[0]?.amount
    const a2 = tx.tokens[1]?.amount
    let s1 = tx.tokens[0]?.symbol
    let s2 = tx.tokens[1]?.symbol

    if (!s1) {
      s1 = tx.tokens[0]?.type
    }

    if (!s2) {
      const foundNetwork = getNetwork(Number(tx.chainId))
      s2 = foundNetwork?.networkToken.symbol
    }

    switch (tx.txType) {
      case TransactionType.BRIDGE:
        return [
          sourceBlockchain ?? 'Unknown',
          ' → ',
          targetBlockchain ?? 'Unknown'
        ]

      case TransactionType.SWAP: {
        return [renderAmount(a1), ' ', s1, ' swapped for ', s2]
      }

      case TransactionType.SEND:
        return [renderAmount(a1), ' ', s1, ' sent']

      case TransactionType.RECEIVE:
        return [renderAmount(a1), ' ', s1, ' received']

      case TransactionType.TRANSFER:
        return [renderAmount(a1), ' ', s1, ' transferred']

      default: {
        if (tx.isContractCall) {
          if (tx.tokens.length === 1) {
            return [renderAmount(a1), ' ', s1]
          }
          if (tx.tokens.length === 2) {
            return [
              renderAmount(a1),
              ' ',
              s1,
              ' ',
              'Contract call',
              ' ',
              renderAmount(a2),
              ' ',
              s2
            ]
          }
          return ['Contract Call']
        }
        return ['Unknown']
      }
    }
  }, [
    tx.tokens,
    tx.txType,
    tx.isContractCall,
    tx.chainId,
    sourceBlockchain,
    targetBlockchain,
    renderAmount,
    getNetwork
  ])

  return (
    <View
      testID={`tx__from_${tx.from.toLowerCase()}_to_${tx.to.toLowerCase()}`}
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        flexWrap: 'wrap'
      }}>
      {nodes.map((node, i) =>
        typeof node === 'string' ? (
          <Text
            key={`txt-${i}`}
            variant={textVariant}
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

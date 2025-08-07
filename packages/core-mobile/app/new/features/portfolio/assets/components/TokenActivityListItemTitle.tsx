import { Text, useTheme, View } from '@avalabs/k2-alpine'
import { TokenType, TransactionType } from '@avalabs/vm-module-types'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { SubTextNumber } from 'common/components/SubTextNumber'
import { useBlockchainNames } from 'common/utils/useBlockchainNames'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import {
  isCollectibleTransaction,
  isUnknownSwap
} from 'features/activity/utils'
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
  // eslint-disable-next-line sonarjs/cognitive-complexity
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
        if (tx.tokens.length === 1) {
          return [
            renderAmount(a1),
            ' ',
            s1,
            ' ',
            sourceBlockchain ?? 'Unknown',
            ' → ',
            targetBlockchain ?? 'Unknown'
          ]
        }
        return ['Unknown']
      case TransactionType.SWAP:
        if (tx.tokens.length === 1) {
          return [renderAmount(a1), ' ', s1, ' swapped for ', s2]
        }
        return [
          renderAmount(a1),
          ' ',
          s1,
          ' swapped for ',
          renderAmount(a2),
          ' ',
          s2
        ]
      case TransactionType.SEND:
        return [renderAmount(a1), ' ', s1, ' sent']
      case TransactionType.RECEIVE:
        return [renderAmount(a1), ' ', s2, ' received']
      case TransactionType.TRANSFER:
        return [renderAmount(a1), ' ', s1, ' transferred']
      case TransactionType.APPROVE:
        return [renderAmount(a1), ' ', s1, ' approved']

      default: {
        if (isCollectibleTransaction(tx)) {
          if (tx.tokens[0]?.type === TokenType.ERC1155) {
            return [`NFT ${tx.isSender ? 'sent' : 'received'}`]
          }

          return [
            `${tx.tokens[0]?.name} (${tx?.tokens[0]?.symbol}) ${
              tx.isSender ? 'sent' : 'received'
            }`
          ]
        }
        if (tx.isContractCall) {
          if (tx.tokens.length === 1) {
            if (isUnknownSwap(tx)) {
              return [renderAmount(a1), ' ', s1, ' swapped for ', s2]
            }
            return [
              renderAmount(a1),
              ' ',
              s1,
              tx.isSender ? ' sent' : ' received'
            ]
          }

          if (tx.tokens.length > 1) {
            if (tx.tokens[0]?.symbol === tx.tokens[1]?.symbol) {
              return [
                renderAmount(a1),
                ' ',
                s1,
                tx.isSender ? ' sent' : ' received'
              ]
            }

            return [
              renderAmount(a1),
              ' ',
              s1,
              ' swapped for ',
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
  }, [tx, getNetwork, renderAmount, sourceBlockchain, targetBlockchain])

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

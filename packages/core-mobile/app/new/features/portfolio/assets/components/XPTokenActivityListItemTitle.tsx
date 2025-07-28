import {
  PChainTransactionType,
  XChainTransactionType
} from '@avalabs/glacier-sdk'
import { Text, useTheme, View } from '@avalabs/k2-alpine'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { SubTextNumber } from 'common/components/SubTextNumber'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import React, { ReactNode, useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { TokenActivityTransaction } from './TokenActivityListItem'

export const XPTokenActivityListItemTitle = ({
  tx
}: {
  tx: TokenActivityTransaction
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const textVariant = 'buttonMedium'

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
    // const a2 = tx.tokens[1]?.amount
    let s1 = tx.tokens[0]?.symbol

    if (!s1) {
      s1 = tx.tokens[0]?.type
    }

    switch (tx.txType) {
      case PChainTransactionType.ADD_SUBNET_VALIDATOR_TX:
        return [renderAmount(a1), ' ', s1, ' ', 'added subnet validator']
      case PChainTransactionType.ADD_VALIDATOR_TX:
      case PChainTransactionType.ADD_PERMISSIONLESS_VALIDATOR_TX:
        return [
          renderAmount(a1),
          ' ',
          s1,
          ' ',
          'added permissionless validator'
        ]
      case PChainTransactionType.ADD_DELEGATOR_TX:
      case PChainTransactionType.ADD_PERMISSIONLESS_DELEGATOR_TX:
        return [
          renderAmount(a1),
          ' ',
          s1,
          ' ',
          'added permissionless delegator'
        ]
      case PChainTransactionType.ADVANCE_TIME_TX:
        return [renderAmount(a1), ' ', s1, ' ', 'advanced time']
      case PChainTransactionType.BASE_TX:
        return [renderAmount(a1), ' ', s1, ' ', 'base transaction']
      case PChainTransactionType.CREATE_CHAIN_TX:
        return [renderAmount(a1), ' ', s1, ' ', 'created chain']
      case PChainTransactionType.CREATE_SUBNET_TX:
        return [renderAmount(a1), ' ', s1, ' ', 'created subnet']
      case PChainTransactionType.EXPORT_TX:
        return [renderAmount(a1), ' ', s1, ' ', 'exported']
      case PChainTransactionType.IMPORT_TX:
        return [renderAmount(a1), ' ', s1, ' ', 'imported']
      case PChainTransactionType.REWARD_VALIDATOR_TX:
        return [renderAmount(a1), ' ', s1, ' ', 'reward validator']
      case PChainTransactionType.REMOVE_SUBNET_VALIDATOR_TX:
        return [renderAmount(a1), ' ', s1, ' ', 'removed subnet validator']
      case PChainTransactionType.TRANSFER_SUBNET_OWNERSHIP_TX:
        return [renderAmount(a1), ' ', s1, ' ', 'transferred subnet ownership']
      case PChainTransactionType.TRANSFORM_SUBNET_TX:
        return [renderAmount(a1), ' ', s1, ' ', 'transformed subnet']
      case XChainTransactionType.CREATE_ASSET_TX:
        return [renderAmount(a1), ' ', s1, ' ', 'created asset']
      case XChainTransactionType.OPERATION_TX:
        return [renderAmount(a1), ' ', s1, ' ', 'operation']
      default:
        return ['Unknown']
    }
  }, [tx.tokens, tx.txType, renderAmount])

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

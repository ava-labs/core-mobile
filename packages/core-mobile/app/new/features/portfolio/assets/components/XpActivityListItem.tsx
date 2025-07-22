import React, { FC, useMemo } from 'react'
import {
  PChainTransactionType,
  XChainTransactionType
} from '@avalabs/glacier-sdk'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { Transaction } from 'store/transaction'
import { alpha, PriceChangeStatus, useTheme, View } from '@avalabs/k2-alpine'
import ActivityListItem from './ActivityListItem'
import { TransactionTypeIcon } from './TransactionTypeIcon'

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

  const title = useMemo(() => {
    switch (tx.txType) {
      case PChainTransactionType.ADD_SUBNET_VALIDATOR_TX:
        return 'Add Subnet Validator'
      case PChainTransactionType.ADD_VALIDATOR_TX:
      case PChainTransactionType.ADD_PERMISSIONLESS_VALIDATOR_TX:
        return 'Add Permissionless Validator'
      case PChainTransactionType.ADD_DELEGATOR_TX:
      case PChainTransactionType.ADD_PERMISSIONLESS_DELEGATOR_TX:
        return 'Add Permissionless Delegator'
      case PChainTransactionType.ADVANCE_TIME_TX:
        return 'Advance Time'
      case PChainTransactionType.BASE_TX:
        return 'BaseTx'
      case PChainTransactionType.CREATE_CHAIN_TX:
        return 'Create Chain'
      case PChainTransactionType.CREATE_SUBNET_TX:
        return 'Create Subnet'
      case PChainTransactionType.EXPORT_TX:
        return 'Export'
      case PChainTransactionType.IMPORT_TX:
        return 'Import'
      case PChainTransactionType.REWARD_VALIDATOR_TX:
        return 'Reward Validator'
      case PChainTransactionType.REMOVE_SUBNET_VALIDATOR_TX:
        return 'Remove Subnet Validator'
      case PChainTransactionType.TRANSFER_SUBNET_OWNERSHIP_TX:
        return 'Transfer Subnet Ownership'
      case PChainTransactionType.TRANSFORM_SUBNET_TX:
        return 'Transform Subnet'
      case XChainTransactionType.CREATE_ASSET_TX:
        return 'Create Asset'
      case XChainTransactionType.OPERATION_TX:
        return 'Operation'
      default:
        return 'Unknown'
    }
  }, [tx.txType])

  const formattedTokenAmount = useMemo(() => {
    const amount = isNaN(Number(tx.tokens[0]?.amount))
      ? UNKNOWN_AMOUNT
      : tx.tokens[0]?.amount
    return amount + ' ' + tx.tokens[0]?.symbol
  }, [tx.tokens])

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
      subtitle={formattedTokenAmount}
      subtitleType="amountInToken"
      icon={transactionTypeIcon}
      onPress={onPress}
      status={PriceChangeStatus.Neutral}
      timestamp={tx.timestamp}
      showSeparator={showSeparator}
    />
  )
}

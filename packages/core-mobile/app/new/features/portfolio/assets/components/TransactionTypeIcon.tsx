import React from 'react'
import { Icons, useTheme } from '@avalabs/k2-alpine'
import { TransactionType } from '@avalabs/vm-module-types'
import {
  PChainTransactionType,
  XChainTransactionType
} from '@avalabs/glacier-sdk'
import { ActivityTransactionType } from 'store/transaction'

export interface TransactionTypeIconProp {
  txType: ActivityTransactionType
  isContractCall: boolean
}

export const TransactionTypeIcon = ({
  txType,
  isContractCall
}: TransactionTypeIconProp): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  switch (txType) {
    case TransactionType.BRIDGE:
      return <Icons.TransactionTypes.Bridge color={colors.$textPrimary} />
    case TransactionType.AIRDROP:
      return <Icons.TransactionTypes.Airdrop color={colors.$textPrimary} />
    case TransactionType.APPROVE:
    case TransactionType.FILL_ORDER:
      return <Icons.TransactionTypes.Approve color={colors.$textPrimary} />
    case TransactionType.UNWRAP:
      return <Icons.TransactionTypes.Unwrap color={colors.$textPrimary} />
    case TransactionType.SWAP:
    case TransactionType.TRANSFER:
      return <Icons.TransactionTypes.Swap color={colors.$textPrimary} />
    case TransactionType.SEND:
    case PChainTransactionType.EXPORT_TX:
      return <Icons.TransactionTypes.Send color={colors.$textPrimary} />
    case TransactionType.RECEIVE:
    case PChainTransactionType.IMPORT_TX:
      return <Icons.TransactionTypes.Receive color={colors.$textPrimary} />
    case PChainTransactionType.ADD_SUBNET_VALIDATOR_TX:
    case PChainTransactionType.CREATE_SUBNET_TX:
    case PChainTransactionType.REMOVE_SUBNET_VALIDATOR_TX:
    case PChainTransactionType.TRANSFER_SUBNET_OWNERSHIP_TX:
    case PChainTransactionType.TRANSFORM_SUBNET_TX:
    case PChainTransactionType.CONVERT_SUBNET_TO_L1TX:
      return <Icons.TransactionTypes.Subnet color={colors.$textPrimary} />
    case PChainTransactionType.ADD_PERMISSIONLESS_DELEGATOR_TX:
    case PChainTransactionType.ADD_PERMISSIONLESS_VALIDATOR_TX:
    case PChainTransactionType.CREATE_CHAIN_TX:
    case XChainTransactionType.CREATE_ASSET_TX:
    case PChainTransactionType.ADD_VALIDATOR_TX:
    case PChainTransactionType.ADD_DELEGATOR_TX:
      return <Icons.TransactionTypes.Add color={colors.$textPrimary} />
    case PChainTransactionType.ADVANCE_TIME_TX:
      return <Icons.TransactionTypes.AdvanceTime color={colors.$textPrimary} />
    case PChainTransactionType.BASE_TX:
    case XChainTransactionType.OPERATION_TX:
      return <Icons.TransactionTypes.ContractCall color={colors.$textPrimary} />
    case PChainTransactionType.REWARD_VALIDATOR_TX:
    case PChainTransactionType.DISABLE_L1VALIDATOR_TX:
    case PChainTransactionType.INCREASE_L1VALIDATOR_BALANCE_TX:
    case PChainTransactionType.REGISTER_L1VALIDATOR_TX:
    case PChainTransactionType.SET_L1VALIDATOR_WEIGHT_TX:
      return <Icons.TransactionTypes.Stake color={colors.$textPrimary} />
    case TransactionType.UNKNOWN:
    default:
      if (isContractCall)
        return (
          <Icons.TransactionTypes.ContractCall color={colors.$textPrimary} />
        )
      return <Icons.TransactionTypes.Unknown color={colors.$textPrimary} />
  }
}

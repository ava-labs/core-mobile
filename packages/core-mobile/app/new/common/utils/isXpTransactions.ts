import {
  PChainTransactionType,
  XChainTransactionType
} from '@avalabs/vm-module-types'
import { ActivityTransactionType } from 'store/transaction'

export const isXpTransaction = (txType: ActivityTransactionType): boolean => {
  return (
    txType === PChainTransactionType.ADD_DELEGATOR_TX ||
    txType === PChainTransactionType.ADD_SUBNET_VALIDATOR_TX ||
    txType === PChainTransactionType.ADD_PERMISSIONLESS_VALIDATOR_TX ||
    txType === PChainTransactionType.ADD_PERMISSIONLESS_DELEGATOR_TX ||
    txType === PChainTransactionType.ADD_VALIDATOR_TX ||
    txType === PChainTransactionType.ADVANCE_TIME_TX ||
    txType === PChainTransactionType.BASE_TX ||
    txType === PChainTransactionType.CREATE_CHAIN_TX ||
    txType === PChainTransactionType.CREATE_SUBNET_TX ||
    txType === PChainTransactionType.EXPORT_TX ||
    txType === PChainTransactionType.IMPORT_TX ||
    txType === PChainTransactionType.REWARD_VALIDATOR_TX ||
    txType === PChainTransactionType.REMOVE_SUBNET_VALIDATOR_TX ||
    txType === PChainTransactionType.TRANSFER_SUBNET_OWNERSHIP_TX ||
    txType === PChainTransactionType.TRANSFORM_SUBNET_TX ||
    txType === PChainTransactionType.UNKNOWN ||
    txType === XChainTransactionType.CREATE_ASSET_TX ||
    txType === XChainTransactionType.OPERATION_TX ||
    txType === XChainTransactionType.UNKNOWN
  )
}

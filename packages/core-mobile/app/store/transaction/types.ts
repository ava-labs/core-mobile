import { CriticalConfig } from '@avalabs/core-bridge-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import {
  PChainTransactionType,
  XChainTransactionType
} from '@avalabs/glacier-sdk'
import { Account } from 'store/account/types'
import {
  TransactionType,
  Transaction as InternalTransaction
} from '@avalabs/vm-module-types'

export type GetTransactionsArgs = {
  nextPageToken?: string
  network: Network
  account: Account | undefined
  criticalConfig: CriticalConfig | undefined
}

export type GetRecentTransactionsArgs = {
  network: Network
  account: Account | undefined
  criticalConfig: CriticalConfig | undefined
}

export type Transaction = Omit<InternalTransaction, 'txType'> & {
  txType: ActivityTransactionType
  isBridge: boolean
}

export type ActivityTransactionType =
  | TransactionType
  | PChainTransactionType
  | XChainTransactionType
  | 'CreateAssetTx'
  | 'OperationTx'

import { CriticalConfig } from '@avalabs/bridge-sdk'
import { Network } from '@avalabs/chains-sdk'
import { Account } from 'store/account'

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

export type Transaction = {
  isBridge: boolean
  isContractCall: boolean
  isIncoming: boolean
  isOutgoing: boolean
  isSender: boolean
  timestamp: number
  hash: string
  amount: string
  from: string
  to: string
  token?: {
    decimal: string
    name: string
    symbol: string
  }
  explorerLink: string
  fee: string
  testID?: string
}

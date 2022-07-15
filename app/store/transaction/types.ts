import { Network } from '@avalabs/chains-sdk'
import { Account } from 'store/account'

export type GetTransactionsArgs = {
  nextPageToken?: string
  network: Network
  account: Account | undefined
}

export type GetAllTransactionsArgs = {
  network: Network
  account: Account | undefined
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
  gasPrice: string
  gasUsed: string
}

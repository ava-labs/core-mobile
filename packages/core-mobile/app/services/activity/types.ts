import { CriticalConfig } from '@avalabs/core-bridge-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import { Account } from 'store/account'
import { Transaction } from 'store/transaction'

export type GetActivitiesForAccountParams = {
  network: Network
  account: Account
  nextPageToken?: string
  pageSize?: number
  criticalConfig: CriticalConfig | undefined
}

export type ActivityResponse = {
  transactions: Transaction[]
  nextPageToken?: string
}

import { CriticalConfig } from '@avalabs/bridge-sdk'
import { Network } from '@avalabs/chains-sdk'
import { Account } from 'store/account'
import { Transaction } from 'store/transaction'

export type GetActivitiesForAccountParams = {
  network: Network
  account: Account
  nextPageToken?: string
  pageSize?: number
  criticalConfig: CriticalConfig | undefined
}

export type GetActivitiesForAddressParams = {
  network: Network
  address: string
  nextPageToken?: string
  pageSize?: number
  criticalConfig: CriticalConfig | undefined
}

export type ActivityResponse = {
  transactions: Transaction[]
  nextPageToken?: string
}

export interface NetworkActivityService {
  getActivities({
    network,
    address,
    criticalConfig
  }: GetActivitiesForAddressParams): Promise<{
    transactions: Transaction[]
  }>
}

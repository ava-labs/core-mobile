import { CriticalConfig } from '@avalabs/core-bridge-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import { Account } from 'store/account'

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

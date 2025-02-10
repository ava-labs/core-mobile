import { TokenWithBalance } from '@avalabs/vm-module-types'

export type LocalTokenId = string

export type LocalTokenWithBalance = TokenWithBalance & {
  localId: string
  isDataAccurate: boolean
}

export type Balance = {
  dataAccurate: boolean
  accountIndex: number
  chainId: number
  tokens: LocalTokenWithBalance[]
}

export type Balances = { [chainId_address: string]: Balance }

export enum QueryStatus {
  /**
   * Indicates no query is in flight
   */
  IDLE = 'idle',

  /**
   * Indicates the query is being run for the first time
   * This status is usually used to show a skeleton loader
   */
  LOADING = 'loading',

  /**
   * Indicates the query is being re-run on demand (user clicks refetch for example)
   * This status is usually used to show a refresh indicator (with ScrollView, Flatlist,...)
   */
  REFETCHING = 'refetching',

  /**
   * Indicates that a polling query is currently in flight.
   * For example if the query runs every 10 seconds then
   * the status will switch to `polling` every 10 seconds until
   * the query has resolved.
   */
  POLLING = 'polling'
}

export type BalanceState = {
  status: QueryStatus
  balances: Balances
}

export const assetPDisplayNames: Record<string, string> = {
  lockedStaked: 'Locked Staked',
  lockedStakeable: 'Locked Stakeable',
  lockedPlatform: 'Locked Platform',
  atomicMemoryLocked: 'Atomic Memory Locked',
  atomicMemoryUnlocked: 'Atomic Memory Unlocked',
  unlockedUnstaked: 'Unlocked Unstaked',
  unlockedStaked: 'Unlocked Staked',
  pendingStaked: 'Pending Staked'
}

export const assetXDisplayNames: Record<string, string> = {
  locked: 'Locked',
  unlocked: 'Unlocked',
  atomicMemoryLocked: 'Atomic Memory Locked',
  atomicMemoryUnlocked: 'Atomic Memory Unlocked'
}

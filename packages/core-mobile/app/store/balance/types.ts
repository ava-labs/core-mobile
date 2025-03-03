import { TokenWithBalance } from '@avalabs/vm-module-types'

export type LocalTokenId = string

export type LocalTokenWithBalance = TokenWithBalance & {
  localId: string
  isDataAccurate: boolean
  networkChainId: number
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

// Assets
export enum AssetNetworkFilter {
  AllNetworks = 'All networks',
  AvalancheCChain = 'Avalanche C-Chain',
  BitcoinNetwork = 'Bitcoin network',
  AvalanchePChain = 'Avalanche P-Chain',
  AvalancheXChain = 'Avalanche X-Chain',
  Ethereum = 'Ethereum'
}

export enum AssetBalanceSort {
  HighToLow = 'High to low balance',
  LowToHigh = 'Low to high balance'
}

export enum AssetManageView {
  Grid = 'Grid view',
  List = 'List view',
  ManageList = 'Manage list'
}

export type AssetBalanceSorts = AssetBalanceSort[][]
export type AssetNetworkFilters = AssetNetworkFilter[][]
export type AssetManageViews = AssetManageView[][]

export const ASSET_NETWORK_FILTERS: AssetNetworkFilters = [
  [
    AssetNetworkFilter.AllNetworks,
    AssetNetworkFilter.AvalancheCChain,
    AssetNetworkFilter.AvalanchePChain,
    AssetNetworkFilter.AvalancheXChain,
    AssetNetworkFilter.BitcoinNetwork,
    AssetNetworkFilter.Ethereum
  ]
]
export const ASSET_BALANCE_SORTS: AssetBalanceSorts = [
  [AssetBalanceSort.HighToLow, AssetBalanceSort.LowToHigh]
]

export const ASSET_MANAGE_VIEWS: AssetManageViews = [
  [AssetManageView.Grid, AssetManageView.List],
  [AssetManageView.ManageList]
]

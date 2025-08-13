import { TokenWithBalance } from '@avalabs/vm-module-types'
import { DropdownGroup } from 'common/components/DropdownMenu'

export type LocalTokenId = string

export type LocalTokenWithBalance = TokenWithBalance & {
  localId: string
  internalId?: string
  isDataAccurate: boolean
  networkChainId: number
}

export type Balance = {
  dataAccurate: boolean
  accountId: string | undefined
  chainId: number
  tokens: LocalTokenWithBalance[]
  error: unknown
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

export const ASSET_BALANCE_SORTS: DropdownGroup[] = [
  {
    key: 'asset-balance-sorts',
    items: [
      {
        id: AssetBalanceSort.HighToLow,
        title: AssetBalanceSort.HighToLow
      },
      {
        id: AssetBalanceSort.LowToHigh,
        title: AssetBalanceSort.LowToHigh
      }
    ]
  }
]

export const ASSET_MANAGE_VIEWS: DropdownGroup[] = [
  {
    key: 'asset-manage-views',
    items: [
      {
        id: AssetManageView.Grid,
        title: AssetManageView.Grid
      },
      {
        id: AssetManageView.List,
        title: AssetManageView.List
      }
    ]
  },
  {
    key: 'asset-manage-list',
    items: [
      {
        id: AssetManageView.ManageList,
        title: AssetManageView.ManageList
      }
    ]
  }
]

// Collectibles
export enum CollectibleStatus {
  Hidden = 'Show hidden Nfts'
}

export enum CollectibleTypeFilter {
  AllContents = 'All contents',
  Pictures = 'Pictures',
  GIFs = 'GIFs',
  Videos = 'Videos'
}

export type AssetNetworkFilterType = AssetNetworkFilter | CollectibleStatus
export type CollectibleFilterType = CollectibleTypeFilter | CollectibleStatus

export enum CollectibleSort {
  NameAToZ = 'Name A to Z',
  NameZToA = 'Name Z to A',
  DateAdded = 'Date Added'
}

export enum CollectibleView {
  LargeGrid = 'Large grid',
  CompactGrid = 'Compact grid',
  ListView = 'List view',
  ManageList = 'Manage list'
}

export const COLLECTIBLE_NETWORK_FILTERS = [
  AssetNetworkFilter.AllNetworks,
  AssetNetworkFilter.AvalancheCChain,
  AssetNetworkFilter.Ethereum
]

export const COLLECTIBLE_TYPE_FILTERS = [
  CollectibleTypeFilter.AllContents,
  CollectibleTypeFilter.Pictures,
  CollectibleTypeFilter.GIFs,
  CollectibleTypeFilter.Videos,
  CollectibleStatus.Hidden
]

export const COLLECTIBLE_FILTERS: DropdownGroup[] = [
  {
    key: 'collectible-network-filters',
    items: COLLECTIBLE_NETWORK_FILTERS.map(f => ({
      id: f,
      title: f
    }))
  },
  {
    key: 'collectible-type-filters',
    items: COLLECTIBLE_TYPE_FILTERS.map(f => ({
      id: f,
      title: f
    }))
  }
]

export const COLLECTIBLE_SORTS: DropdownGroup[] = [
  {
    key: 'collectible-sorts',
    items: [
      {
        id: CollectibleSort.NameAToZ,
        title: CollectibleSort.NameAToZ
      },
      {
        id: CollectibleSort.NameZToA,
        title: CollectibleSort.NameZToA
      },
      {
        id: CollectibleSort.DateAdded,
        title: CollectibleSort.DateAdded
      }
    ]
  }
]

export const COLLECTIBLE_VIEWS: DropdownGroup[] = [
  {
    key: 'collectible-views',
    items: [
      {
        id: CollectibleView.LargeGrid,
        title: CollectibleView.LargeGrid
      },
      {
        id: CollectibleView.CompactGrid,
        title: CollectibleView.CompactGrid
      },
      {
        id: CollectibleView.ListView,
        title: CollectibleView.ListView
      }
    ]
  },
  {
    key: 'manage-list',
    items: [
      {
        id: CollectibleView.ManageList,
        title: CollectibleView.ManageList
      }
    ]
  }
]

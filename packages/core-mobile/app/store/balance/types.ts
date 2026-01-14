import { TokenWithBalance } from '@avalabs/vm-module-types'
import { DropdownGroup } from 'common/components/DropdownMenu'
import { CollectibleViewOption, ViewOption } from 'common/types'

export type LocalTokenWithBalance = TokenWithBalance & {
  localId: string
  internalId?: string
  isDataAccurate: boolean
  networkChainId: number
}

export const assetPDisplayNames: Record<string, string> = {
  lockedStaked: 'Locked staked',
  lockedStakeable: 'Locked stakeable',
  lockedPlatform: 'Locked platform',
  atomicMemoryLocked: 'Atomic memory locked',
  atomicMemoryUnlocked: 'Atomic memory unlocked',
  unlockedUnstaked: 'Unlocked unstaked',
  unlockedStaked: 'Unlocked staked'
}

export const assetXDisplayNames: Record<string, string> = {
  locked: 'Locked',
  unlocked: 'Unlocked',
  atomicMemoryLocked: 'Atomic memory locked',
  atomicMemoryUnlocked: 'Atomic memory unlocked'
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
  Grid = ViewOption.Grid,
  List = ViewOption.List,
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

export enum CollectibleSort {
  NameAToZ = 'Name A to Z',
  NameZToA = 'Name Z to A',
  DateAdded = 'Date Added'
}

export enum CollectibleView {
  LargeGrid = CollectibleViewOption.LargeGrid,
  CompactGrid = CollectibleViewOption.CompactGrid,
  ListView = CollectibleViewOption.List,
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

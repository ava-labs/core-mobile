import { Easing, FadeInRight, FadeInUp } from 'react-native-reanimated'
import {
  AssetBalanceSorts,
  AssetManageViews,
  AssetNetworkFilters
} from './types'

export enum AssetNetworkFilter {
  AllNetworks = 'All networks',
  AvalancheCChain = 'Avalanche C-Chain',
  BitcoinNetwork = 'Bitcoin network',
  Ethereum = 'Ethereum'
}
export enum AssetBalanceSort {
  HighToLow = 'High to low balance',
  LowToHigh = 'Low to high balance'
}

export enum AssetManageView {
  Hightlights = 'Highlights',
  AssetList = 'Asset list',
  ManageList = 'Manage list'
}

export const ASSET_NETWORK_FILTERS: AssetNetworkFilters = [
  [
    AssetNetworkFilter.AllNetworks,
    AssetNetworkFilter.AvalancheCChain,
    AssetNetworkFilter.BitcoinNetwork,
    AssetNetworkFilter.Ethereum
  ]
]
export const ASSET_BALANCE_SORTS: AssetBalanceSorts = [
  [AssetBalanceSort.HighToLow, AssetBalanceSort.LowToHigh]
]

export const ASSET_MANAGE_VIEWS: AssetManageViews = [
  [AssetManageView.Hightlights, AssetManageView.AssetList],
  [AssetManageView.ManageList]
]

export const SQUARE_BUTTONS = [
  [AssetBalanceSort.HighToLow, AssetBalanceSort.LowToHigh]
]

export enum ActionButtonTitle {
  Send = 'Send',
  Swap = 'Swap',
  Buy = 'Buy',
  Stake = 'Stake',
  Bridge = 'Bridge',
  Connect = 'Connect'
}

export const LIST_ITEM_HEIGHT = 60
export const GRID_ITEM_HEIGHT = 170

export const getItemEnteringAnimation = (index: number): FadeInRight =>
  FadeInRight.duration(100)
    .delay(index * 50)
    .easing(Easing.bezierFn(0.25, 1, 0.5, 1))
    .springify()

export const getListItemEnteringAnimation = (index: number): FadeInRight =>
  FadeInUp.duration(100)
    .delay(index * 50)
    .easing(Easing.bezierFn(0.25, 1, 0.5, 1))
    .springify()

export const SEGMENT_CONTROL_HEIGHT = 40

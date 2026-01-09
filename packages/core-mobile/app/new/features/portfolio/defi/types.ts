import { ViewOption } from 'common/types'

export enum DeFiSortOption {
  NameAtoZ = 'Name A to Z',
  NameZtoA = 'Name Z to A'
}

export const DEFI_SORT_OPTIONS = {
  key: 'defi-sort-options',
  items: [
    { id: DeFiSortOption.NameAtoZ, title: DeFiSortOption.NameAtoZ },
    { id: DeFiSortOption.NameZtoA, title: DeFiSortOption.NameZtoA }
  ]
}

export const DEFI_VIEW_OPTIONS = {
  key: 'defi-view-options',
  items: [
    { id: ViewOption.Grid, title: ViewOption.Grid },
    { id: ViewOption.List, title: ViewOption.List }
  ]
}

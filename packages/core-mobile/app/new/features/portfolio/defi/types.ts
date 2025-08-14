export enum DeFiSortOption {
  NameAtoZ = 'Name A to Z',
  NameZtoA = 'Name Z to A'
}

export enum DeFiViewOption {
  GridView = 'Grid view',
  ListView = 'List view'
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
    { id: DeFiViewOption.GridView, title: DeFiViewOption.GridView },
    { id: DeFiViewOption.ListView, title: DeFiViewOption.ListView }
  ]
}

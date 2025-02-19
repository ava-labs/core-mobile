import { IndexPath } from '@avalabs/k2-alpine'
import { useMemo, useState } from 'react'
import {
  ASSET_BALANCE_SORTS,
  ASSET_MANAGE_VIEWS,
  ASSET_NETWORK_FILTERS,
  AssetBalanceSort,
  AssetManageView,
  AssetNetworkFilter,
  LocalTokenWithBalance,
  selectFilteredAndSortedTokensWithBalance
} from 'store/balance'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'

export type Selection = {
  title: string
  data: string[][]
  selected: IndexPath
  onSelected: (index: IndexPath) => void
}

export const useFilterAndSort = (): {
  data: LocalTokenWithBalance[]
  filter: Selection
  sort: Selection
  view: Selection
} => {
  const activeAccount = useSelector(selectActiveAccount)

  const [selectedFilter, setSelectedFilter] = useState<IndexPath>({
    section: 0,
    row: 0
  })
  const [selectedSort, setSelectedSort] = useState<IndexPath>({
    section: 0,
    row: 0
  })
  const [selectedView, setSelectedView] = useState<IndexPath>({
    section: 0,
    row: 1
  })

  const filterOption = useMemo(() => {
    return (
      ASSET_NETWORK_FILTERS?.[selectedFilter.section]?.[selectedFilter.row] ??
      AssetNetworkFilter.AllNetworks
    )
  }, [selectedFilter])

  const sortOption = useMemo(() => {
    return (
      ASSET_BALANCE_SORTS?.[selectedSort.section]?.[selectedSort.row] ??
      AssetBalanceSort.HighToLow
    )
  }, [selectedSort])

  const filteredAndSorted = useSelector(
    selectFilteredAndSortedTokensWithBalance(
      sortOption,
      filterOption,
      activeAccount?.index
    )
  )

  const onSelectedView = (indexPath: IndexPath): void => {
    const manageList = ASSET_MANAGE_VIEWS?.[indexPath.section]?.[indexPath.row]
    if (manageList === AssetManageView.ManageList) {
      // TODO: navigate to manage list
      return
    }
    setSelectedView(indexPath)
  }

  return {
    filter: {
      title: 'Filter',
      data: ASSET_NETWORK_FILTERS,
      selected: selectedFilter,
      onSelected: setSelectedFilter
    },
    sort: {
      title: 'Sort',
      data: ASSET_BALANCE_SORTS,
      selected: selectedSort,
      onSelected: setSelectedSort
    },
    view: {
      title: 'View',
      data: ASSET_MANAGE_VIEWS,
      selected: selectedView,
      onSelected: onSelectedView
    },
    data: filteredAndSorted
  }
}

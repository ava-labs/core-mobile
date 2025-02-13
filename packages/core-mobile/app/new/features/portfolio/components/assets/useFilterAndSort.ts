import { IndexPath, usePopoverAnchor } from '@avalabs/k2-alpine'
import { RefObject, useMemo, useRef, useState } from 'react'
import {
  LocalTokenWithBalance,
  selectFilteredAndSortedTokensWithBalance
} from 'store/balance'
import { useSelector } from 'react-redux'
import { TouchableOpacity } from 'react-native'
import { Rect } from 'react-native-popover-view'
import { selectActiveAccount } from 'store/account'
import {
  AssetBalanceSort,
  AssetManageView,
  AssetNetworkFilter,
  ASSET_BALANCE_SORTS,
  ASSET_MANAGE_VIEWS,
  ASSET_NETWORK_FILTERS
} from './consts'

export type Selection = {
  title: string
  data: string[][]
  selected: IndexPath
  onSelected: (index: IndexPath) => void
  ref: RefObject<TouchableOpacity>
  anchorRect: Rect | undefined
  isPopoverVisible: boolean
  onShowPopover: () => void
  onHidePopover: () => void
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

  const filterRef = useRef<TouchableOpacity>(null)
  const sortRef = useRef<TouchableOpacity>(null)
  const viewRef = useRef<TouchableOpacity>(null)

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

  const {
    anchorRect: filterAnchorRect,
    isPopoverVisible: isFilterPopoverVisible,
    onShowPopover: onShowFilterPopover,
    onHidePopover: onHideFilterPopover
  } = usePopoverAnchor(filterRef)

  const {
    anchorRect: sortAnchorRect,
    isPopoverVisible: isSortPopoverVisible,
    onShowPopover: onShowSortPopover,
    onHidePopover: onHideSortPopover
  } = usePopoverAnchor(sortRef)

  const {
    anchorRect: viewAnchorRect,
    isPopoverVisible: isViewPopoverVisible,
    onShowPopover: onShowViewPopover,
    onHidePopover: onHideViewPopover
  } = usePopoverAnchor(viewRef)

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
      ref: filterRef,
      anchorRect: filterAnchorRect,
      isPopoverVisible: isFilterPopoverVisible,
      onShowPopover: onShowFilterPopover,
      onHidePopover: onHideFilterPopover,
      selected: selectedFilter,
      onSelected: setSelectedFilter
    },
    sort: {
      title: 'Sort',
      data: ASSET_BALANCE_SORTS,
      ref: sortRef,
      anchorRect: sortAnchorRect,
      isPopoverVisible: isSortPopoverVisible,
      onShowPopover: onShowSortPopover,
      onHidePopover: onHideSortPopover,
      selected: selectedSort,
      onSelected: setSelectedSort
    },
    view: {
      title: 'View',
      data: ASSET_MANAGE_VIEWS,
      ref: viewRef,
      anchorRect: viewAnchorRect,
      isPopoverVisible: isViewPopoverVisible,
      onShowPopover: onShowViewPopover,
      onHidePopover: onHideViewPopover,
      selected: selectedView,
      onSelected: onSelectedView
    },
    data: filteredAndSorted
  }
}

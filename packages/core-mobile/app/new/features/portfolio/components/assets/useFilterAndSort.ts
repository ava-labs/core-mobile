import { IndexPath, usePopoverAnchor } from '@avalabs/k2-alpine'
import { RefObject, useMemo, useRef } from 'react'
import { LocalTokenWithBalance } from 'store/balance'
import { sortUndefined } from 'common/utils/sortUndefined'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectAssetsFilter,
  selectAssetsSort,
  selectAssetsView,
  setFilter,
  setSort,
  setView
} from 'store/assets'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
import { TouchableOpacity } from 'react-native'
import { Rect } from 'react-native-popover-view'
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

export const useFilterAndSort = (
  tokens: LocalTokenWithBalance[]
): {
  data: LocalTokenWithBalance[]
  filter: Selection
  sort: Selection
  view: Selection
} => {
  const dispatch = useDispatch()
  const selectedFilter = useSelector(selectAssetsFilter)
  const selectedSort = useSelector(selectAssetsSort)
  const selectedView = useSelector(selectAssetsView)

  const filterRef = useRef<TouchableOpacity>(null)
  const sortRef = useRef<TouchableOpacity>(null)
  const viewRef = useRef<TouchableOpacity>(null)

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

  const setSelectedFilter = (indexPath: IndexPath): void => {
    dispatch(setFilter(indexPath))
  }
  const setSelectedSort = (indexPath: IndexPath): void => {
    dispatch(setSort(indexPath))
  }
  const setSelectedView = (indexPath: IndexPath): void => {
    dispatch(setView(indexPath))
  }

  const onSelectedView = (indexPath: IndexPath): void => {
    const manageList = ASSET_MANAGE_VIEWS?.[indexPath.section]?.[indexPath.row]
    if (manageList === AssetManageView.ManageList) {
      // TODO: navigate to manage list
      return
    }
    setSelectedView(indexPath)
  }

  const filtered = useMemo(() => {
    const filter =
      ASSET_NETWORK_FILTERS?.[selectedFilter.section]?.[selectedFilter.row]

    if (filter === AssetNetworkFilter.AvalancheCChain) {
      return tokens.filter(
        token =>
          ('chainId' in token &&
            token.chainId &&
            isAvalancheCChainId(token.chainId)) ||
          token.localId === 'AvalancheAVAX'
      )
    }
    if (filter === AssetNetworkFilter.Ethereum) {
      return tokens.filter(
        token =>
          'chainId' in token &&
          (token.chainId === 1 ||
            token.chainId === 5 ||
            token.chainId === 11155111)
      )
    }
    if (filter === AssetNetworkFilter.BitcoinNetwork) {
      return tokens.filter(token => token.symbol === 'BTC')
    }
    return tokens
  }, [selectedFilter, tokens])

  const sorted = useMemo(() => {
    const sort = ASSET_BALANCE_SORTS?.[selectedSort.section]?.[selectedSort.row]

    if (sort === AssetBalanceSort.LowToHigh) {
      return filtered?.sort((a, b) =>
        sortUndefined(a.balanceInCurrency, b.balanceInCurrency)
      )
    }

    return filtered?.sort((a, b) =>
      sortUndefined(b.balanceInCurrency, a.balanceInCurrency)
    )
  }, [filtered, selectedSort])

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
    data: sorted
  }
}

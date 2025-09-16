import { DropdownSelection } from 'common/types'
import { useCallback, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { isAvalancheChainId } from 'services/network/utils/isAvalancheNetwork'
import { isEthereumChainId } from 'services/network/utils/isEthereumNetwork'
import { NftItem, NftLocalStatus } from 'services/nft/types'
import {
  AssetNetworkFilter,
  COLLECTIBLE_FILTERS,
  COLLECTIBLE_NETWORK_FILTERS,
  COLLECTIBLE_SORTS,
  COLLECTIBLE_TYPE_FILTERS,
  COLLECTIBLE_VIEWS,
  CollectibleSort,
  CollectibleStatus,
  CollectibleTypeFilter,
  CollectibleView
} from 'store/balance'
import { NftContentType } from 'store/nft'
import { isCollectibleVisible } from 'store/nft/utils'
import {
  selectCollectibleUnprocessableVisibility,
  selectCollectibleVisibility,
  toggleCollectibleUnprocessableVisibility
} from 'store/portfolio'
import { sortNftsByDateUpdated } from 'services/nft/utils'
import { useCollectiblesContext } from '../CollectiblesContext'
import { getCollectibleName } from '../consts'

export type CollectibleFilterAndSortInitialState = {
  filters: {
    network: AssetNetworkFilter
    contentType: CollectibleTypeFilter
  }
  sort: CollectibleSort
}

export const useCollectiblesFilterAndSort = (
  initial?: CollectibleFilterAndSortInitialState
): {
  filteredAndSorted: NftItem[]
  filter: DropdownSelection & { selected: string[] }
  sort: DropdownSelection
  view: DropdownSelection
  isEveryCollectibleHidden: boolean
  isUnprocessableHidden: boolean
  isHiddenVisible: boolean
  onResetFilter: () => void
  onShowHidden: () => void
} => {
  const { collectibles } = useCollectiblesContext()
  const collectiblesVisibility = useSelector(selectCollectibleVisibility)
  const [selectedNetworkFilter, setSelectedNetworkFilter] =
    useState<AssetNetworkFilter>(
      initial?.filters?.network ?? AssetNetworkFilter.AllNetworks
    )

  const [selectedContentTypeFilter, setSelectedContentTypeFilter] = useState<
    CollectibleTypeFilter | CollectibleStatus
  >(initial?.filters?.contentType ?? CollectibleTypeFilter.AllContents)

  const [selectedSort, setSelectedSort] = useState<CollectibleSort>(
    initial?.sort ?? CollectibleSort.NameAToZ
  )

  const [selectedView, setSelectedView] = useState<CollectibleView>(
    CollectibleView.LargeGrid
  )

  const filterData = useMemo(() => {
    return COLLECTIBLE_FILTERS.map(s => {
      return {
        key: s.key,
        items: s.items.map(i => ({
          id: i.id,
          title: i.id,
          selected:
            i.id === selectedNetworkFilter || i.id === selectedContentTypeFilter
        }))
      }
    })
  }, [selectedContentTypeFilter, selectedNetworkFilter])

  const sortData = useMemo(() => {
    return COLLECTIBLE_SORTS.map(s => {
      return {
        key: s.key,
        items: s.items.map(i => ({
          id: i.id,
          title: i.id,
          selected: i.id === selectedSort
        }))
      }
    })
  }, [selectedSort])

  const viewData = useMemo(() => {
    return COLLECTIBLE_VIEWS.map(s => {
      return {
        key: s.key,
        items: s.items.map(i => ({
          id: i.id,
          title: i.id,
          selected: i.id === selectedView
        }))
      }
    })
  }, [selectedView])

  const filter = useMemo(
    () => ({
      title: 'Filter',
      data: filterData,
      selected: [selectedNetworkFilter, selectedContentTypeFilter],
      onSelected: (value: AssetNetworkFilter | CollectibleTypeFilter) => {
        if (COLLECTIBLE_NETWORK_FILTERS.includes(value as AssetNetworkFilter)) {
          value === selectedNetworkFilter
            ? setSelectedNetworkFilter(AssetNetworkFilter.AllNetworks)
            : setSelectedNetworkFilter(value as AssetNetworkFilter)
        } else if (
          COLLECTIBLE_TYPE_FILTERS.includes(value as CollectibleTypeFilter)
        ) {
          value === selectedContentTypeFilter
            ? setSelectedContentTypeFilter(CollectibleTypeFilter.AllContents)
            : setSelectedContentTypeFilter(value as CollectibleTypeFilter)
        }
      }
    }),
    [filterData, selectedContentTypeFilter, selectedNetworkFilter]
  )
  const sort = useMemo(
    () => ({
      title: 'Sort',
      data: sortData,
      selected: selectedSort,
      onSelected: (value: string) => {
        setSelectedSort(value as CollectibleSort)
      }
    }),
    [sortData, selectedSort]
  )

  const view = useMemo(
    () => ({
      title: 'View',
      data: viewData,
      selected: selectedView,
      onSelected: (value: string) => {
        setSelectedView(value as CollectibleView)
      }
    }),
    [viewData, selectedView]
  )

  const isUnprocessableHidden = useSelector(
    selectCollectibleUnprocessableVisibility
  )

  const getFiltered = useCallback(
    (nfts: NftItem[]) => {
      if (nfts.length === 0) return []

      const [network, contentType] = filter.selected

      const availableNetworks = [
        AssetNetworkFilter.AvalancheCChain,
        AssetNetworkFilter.Ethereum
      ]
      const availableContentTypes = [
        CollectibleTypeFilter.AllContents,
        CollectibleTypeFilter.Pictures,
        CollectibleTypeFilter.GIFs,
        CollectibleTypeFilter.Videos
      ]

      let tempNfts = [...nfts]

      if (isUnprocessableHidden)
        tempNfts = tempNfts.filter((nft: NftItem) => {
          return nft.status === NftLocalStatus.Processed
        })

      if (contentType !== CollectibleStatus.Hidden)
        tempNfts = tempNfts.filter((nft: NftItem) => {
          return isCollectibleVisible(collectiblesVisibility, nft)
        })

      if (availableNetworks.includes(network as AssetNetworkFilter))
        tempNfts = tempNfts.filter((nft: NftItem) => {
          switch (network) {
            case AssetNetworkFilter.AvalancheCChain:
              return isAvalancheChainId(nft.networkChainId)
            case AssetNetworkFilter.Ethereum:
              return isEthereumChainId(nft.networkChainId)
            default:
              return true
          }
        })

      if (availableContentTypes.includes(contentType as CollectibleTypeFilter))
        tempNfts = tempNfts.filter((nft: NftItem) => {
          switch (contentType) {
            case CollectibleTypeFilter.Pictures:
              return (
                nft.imageData?.type === NftContentType.JPG ||
                nft.imageData?.type === NftContentType.PNG ||
                nft.imageData?.type === NftContentType.Unknown
              )
            case CollectibleTypeFilter.GIFs:
              return nft.imageData?.type === NftContentType.GIF
            case CollectibleTypeFilter.Videos:
              return nft.imageData?.type === NftContentType.MP4
            case CollectibleTypeFilter.AllContents:
            default:
              return true
          }
        })

      return tempNfts
    },
    [filter.selected, isUnprocessableHidden, collectiblesVisibility]
  )

  const getSorted = useCallback(
    (filtered: NftItem[]) => {
      if (sort.selected === CollectibleSort.NameAToZ)
        return filtered.sort((a, b) =>
          getCollectibleName(a) > getCollectibleName(b) ? 1 : -1
        )

      if (sort.selected === CollectibleSort.NameZToA)
        return filtered.sort((a, b) =>
          getCollectibleName(a) < getCollectibleName(b) ? 1 : -1
        )

      if (sort.selected === CollectibleSort.DateAdded)
        return filtered.sort(sortNftsByDateUpdated)

      return filtered
    },
    [sort.selected]
  )

  const dispatch = useDispatch()

  const onResetFilter = (): void => {
    setSelectedNetworkFilter(AssetNetworkFilter.AllNetworks)
    setSelectedContentTypeFilter(CollectibleTypeFilter.AllContents)
  }

  const onShowHidden = (): void => {
    setSelectedContentTypeFilter(CollectibleStatus.Hidden)
    if (isUnprocessableHidden && isEveryCollectibleHidden) {
      dispatch(toggleCollectibleUnprocessableVisibility())
    }
  }

  const filteredAndSorted = useMemo(() => {
    const filtered = getFiltered(collectibles)
    return getSorted(filtered)
  }, [collectibles, getFiltered, getSorted])

  const isEveryCollectibleHidden = useMemo(
    () =>
      filteredAndSorted.every(collectible =>
        isCollectibleVisible(collectiblesVisibility, collectible)
      ) && collectibles?.length > 0,
    [collectibles?.length, collectiblesVisibility, filteredAndSorted]
  )

  const isHiddenVisible = filter.selected[1] !== CollectibleStatus.Hidden

  return {
    filteredAndSorted,
    filter: filter as DropdownSelection & { selected: string[] },
    sort,
    view,
    isHiddenVisible,
    isEveryCollectibleHidden,
    isUnprocessableHidden,
    onResetFilter,
    onShowHidden
  }
}

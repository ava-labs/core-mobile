import { DropdownSelection } from 'common/types'
import { useCallback, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { isAvalancheChainId } from 'services/network/utils/isAvalancheNetwork'
import { isEthereumChainId } from 'services/network/utils/isEthereumNetwork'
import { NftContentType, NftItem, NftLocalStatus } from 'services/nft/types'
import {
  AssetNetworkFilter,
  COLLECTIBLE_FILTERS,
  COLLECTIBLE_NETWORK_FILTERS,
  COLLECTIBLE_SORTS,
  COLLECTIBLE_TYPE_FILTERS,
  COLLECTIBLE_VIEWS,
  CollectibleSort,
  CollectibleStatus,
  CollectibleTypeFilter
} from 'store/balance'
import { isCollectibleVisible } from 'store/nft/utils'
import {
  selectCollectibleUnprocessableVisibility,
  selectCollectibleVisibility
} from 'store/portfolio'
import { sortNftsByDateUpdated } from 'services/nft/utils'
import { useCollectiblesView } from 'features/portfolio/store'
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
  const { selectedView, setSelectedView } = useCollectiblesView()

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
      onSelected: setSelectedView
    }),
    [viewData, selectedView, setSelectedView]
  )

  const isUnprocessableHidden = useSelector(
    selectCollectibleUnprocessableVisibility
  )

  const getFiltered = useCallback(
    (nfts: NftItem[]) => {
      if (nfts?.length === 0) return []

      const [network, contentType] = filter.selected
      const isShowingHidden = contentType === CollectibleStatus.Hidden

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

      let tempNfts = [...(nfts ?? [])]

      // In "Show hidden" mode we intentionally bypass the unprocessable filter
      // so that explicitly-hidden unprocessable items also appear in the list.
      if (isUnprocessableHidden && !isShowingHidden)
        tempNfts = tempNfts.filter((nft: NftItem) => {
          return nft.status === NftLocalStatus.Processed
        })

      // "Show hidden" mode: show only items the user has hidden.
      // Normal mode: show only visible items.
      tempNfts = tempNfts.filter((nft: NftItem) => {
        const visible = isCollectibleVisible(collectiblesVisibility, nft)
        return isShowingHidden ? !visible : visible
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
      const compareByStatus = (a: NftItem, b: NftItem): number => {
        const aUnprocessable = a.status === NftLocalStatus.Unprocessable ? 1 : 0
        const bUnprocessable = b.status === NftLocalStatus.Unprocessable ? 1 : 0
        return aUnprocessable - bUnprocessable
      }

      const compareBySelected = (a: NftItem, b: NftItem): number => {
        switch (sort.selected) {
          case CollectibleSort.NameAToZ:
            return getCollectibleName(a) > getCollectibleName(b) ? 1 : -1
          case CollectibleSort.NameZToA:
            return getCollectibleName(a) < getCollectibleName(b) ? 1 : -1
          case CollectibleSort.DateAdded:
            return sortNftsByDateUpdated(a, b)
          default:
            return 0
        }
      }

      return [...filtered].sort(
        (a, b) => compareByStatus(a, b) || compareBySelected(a, b)
      )
    },
    [sort.selected]
  )

  const onResetFilter = (): void => {
    setSelectedNetworkFilter(AssetNetworkFilter.AllNetworks)
    setSelectedContentTypeFilter(CollectibleTypeFilter.AllContents)
  }

  const onShowHidden = (): void => {
    setSelectedContentTypeFilter(CollectibleStatus.Hidden)
  }

  const filteredAndSorted = useMemo(() => {
    const filtered = getFiltered(collectibles)
    return getSorted(filtered)
  }, [collectibles, getFiltered, getSorted])

  const isEveryCollectibleHidden = useMemo(
    () =>
      collectibles.length > 0 &&
      collectibles.every(c => !isCollectibleVisible(collectiblesVisibility, c)),
    [collectibles, collectiblesVisibility]
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

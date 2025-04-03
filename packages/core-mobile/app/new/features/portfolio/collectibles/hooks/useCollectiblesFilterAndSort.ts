import { IndexPath } from '@avalabs/k2-alpine'
import { DropdownSelection } from 'common/types'
import { useCallback, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { isAvalancheChainId } from 'services/network/utils/isAvalancheNetwork'
import { isEthereumChainId } from 'services/network/utils/isEthereumNetwork'
import { NftItem, NftLocalStatus } from 'services/nft/types'
import {
  AssetNetworkFilter,
  COLLECTIBLE_FILTERS,
  COLLECTIBLE_SORTS,
  COLLECTIBLE_VIEWS,
  CollectibleSort,
  CollectibleStatus,
  CollectibleTypeFilter
} from 'store/balance'
import { NftContentType } from 'store/nft'
import { isCollectibleVisible } from 'store/nft/utils'
import {
  selectCollectibleUnprocessableVisibility,
  selectCollectibleVisibility,
  toggleCollectibleUnprocessableVisibility
} from 'store/portfolio'
import { useCollectiblesContext } from '../CollectiblesContext'
import { getCollectibleName } from '../consts'

export type CollectibleFilterAndSortInitialState = {
  filters: {
    network: IndexPath
    contentType: IndexPath
  }
  sort: IndexPath
}

export const useCollectiblesFilterAndSort = (
  initial?: CollectibleFilterAndSortInitialState
): {
  filteredAndSorted: NftItem[]
  filter: DropdownSelection & { selected: IndexPath[] }
  sort: DropdownSelection
  view: DropdownSelection
  isEveryCollectibleHidden: boolean
  onResetFilter: () => void
  onShowHidden: () => void
} => {
  const { collectibles } = useCollectiblesContext()
  const collectiblesVisibility = useSelector(selectCollectibleVisibility)
  const [selectedNetworkFilter, setSelectedNetworkFilter] = useState<IndexPath>(
    initial?.filters?.network ?? {
      section: 0,
      row: 0
    }
  )

  const [selectedContentTypeFilter, setSelectedContentTypeFilter] =
    useState<IndexPath>(
      initial?.filters?.contentType ?? {
        section: 0,
        row: 0
      }
    )

  const [selectedSort, setSelectedSort] = useState<IndexPath>(
    initial?.sort ?? {
      section: 0,
      row: 2
    }
  )

  const [selectedView, setSelectedView] = useState<IndexPath>({
    section: 0,
    row: 0
  })

  const filterOption = useMemo(() => {
    return [
      COLLECTIBLE_FILTERS?.[selectedNetworkFilter.section]?.[
        selectedNetworkFilter.row
      ] ?? undefined,
      COLLECTIBLE_FILTERS?.[selectedContentTypeFilter.section]?.[
        selectedContentTypeFilter.row
      ] ?? undefined
    ]
  }, [selectedContentTypeFilter, selectedNetworkFilter])

  const sortOption = useMemo(() => {
    return (
      COLLECTIBLE_SORTS?.[selectedSort.section]?.[selectedSort.row] ??
      CollectibleSort.NameAToZ
    )
  }, [selectedSort])

  const filter = useMemo(
    () => ({
      title: 'Filter',
      data: COLLECTIBLE_FILTERS,
      selected: [selectedNetworkFilter, selectedContentTypeFilter],
      onSelected: (value: IndexPath) => {
        if (value.section === 0) {
          setSelectedNetworkFilter(value)
        } else if (value.section === 1) {
          setSelectedContentTypeFilter(value)
        }
      },
      onDeselect: (value: IndexPath) => {
        if (value.section === 0) {
          setSelectedNetworkFilter({
            section: 0,
            row: 0
          })
        }
        if (value.section === 1)
          setSelectedContentTypeFilter({
            section: 0,
            row: 0
          })
      }
    }),
    [selectedContentTypeFilter, selectedNetworkFilter]
  )
  const sort = useMemo(
    () => ({
      title: 'Sort',
      data: COLLECTIBLE_SORTS,
      selected: selectedSort,
      onSelected: setSelectedSort,
      useAnchorRect: true
    }),
    [selectedSort]
  )

  const view = useMemo(
    () => ({
      title: 'View',
      data: COLLECTIBLE_VIEWS,
      selected: selectedView,
      onSelected: setSelectedView
    }),
    [selectedView]
  )

  const isUnprocessableHidden = useSelector(
    selectCollectibleUnprocessableVisibility
  )

  const getFiltered = useCallback(
    (nfts: NftItem[]) => {
      if (nfts.length === 0) return []

      const [network, contentType] = filterOption

      const availableNetworks = [
        AssetNetworkFilter.AvalancheCChain,
        AssetNetworkFilter.Ethereum
      ]
      const availableContentTypes = [
        CollectibleTypeFilter.Pictures,
        CollectibleTypeFilter.GIFs,
        CollectibleTypeFilter.Videos
      ]

      if (isUnprocessableHidden)
        nfts = nfts.filter((nft: NftItem) => {
          return nft.status !== NftLocalStatus.Unprocessable
        })

      if (contentType !== CollectibleStatus.Hidden)
        nfts = nfts.filter((nft: NftItem) => {
          return isCollectibleVisible(collectiblesVisibility, nft)
        })

      if (availableNetworks.includes(network as AssetNetworkFilter))
        nfts = nfts.filter((nft: NftItem) => {
          switch (network) {
            case AssetNetworkFilter.AvalancheCChain:
              return isAvalancheChainId(nft.chainId)
            case AssetNetworkFilter.Ethereum:
              return isEthereumChainId(nft.chainId)
            default:
              return true
          }
        })

      if (availableContentTypes.includes(contentType as CollectibleTypeFilter))
        nfts = nfts.filter((nft: NftItem) => {
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
            default:
              return true
          }
        })

      return nfts
    },
    [filterOption, isUnprocessableHidden, collectiblesVisibility]
  )

  const getSorted = useCallback(
    (filtered: NftItem[]) => {
      if (sortOption === CollectibleSort.NameAToZ)
        return filtered?.sort((a, b) =>
          getCollectibleName(a) > getCollectibleName(b) ? 1 : -1
        )

      if (sortOption === CollectibleSort.NameZToA)
        return filtered?.sort((a, b) =>
          getCollectibleName(a) < getCollectibleName(b) ? 1 : -1
        )

      return filtered
    },
    [sortOption]
  )

  const dispatch = useDispatch()

  const onResetFilter = (): void => {
    setSelectedNetworkFilter({ section: 0, row: 0 })
    setSelectedContentTypeFilter({ section: 0, row: 0 })
  }

  const onShowHidden = (): void => {
    setSelectedContentTypeFilter({
      section: 1,
      row: 3
    })
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

  return {
    filteredAndSorted,
    filter: filter as DropdownSelection & { selected: IndexPath[] },
    sort,
    view,
    isEveryCollectibleHidden,
    onResetFilter,
    onShowHidden
  }
}

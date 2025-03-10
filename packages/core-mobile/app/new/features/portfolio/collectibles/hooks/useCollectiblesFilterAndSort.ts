import { ChainId } from '@avalabs/core-chains-sdk'
import { IndexPath } from '@avalabs/k2-alpine'
import { DropdownSelection } from 'common/types'
import { useCallback, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { NftItem } from 'services/nft/types'
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
import { selectCollectibleVisibility } from 'store/portfolio'

export const useCollectiblesFilterAndSort = (
  collectibles: NftItem[]
): {
  filteredAndSorted: NftItem[]
  filter: DropdownSelection & { selected: IndexPath[] }
  sort: DropdownSelection
  view: DropdownSelection
  onResetFilter: () => void
} => {
  const collectiblesVisibility = useSelector(selectCollectibleVisibility)
  const [selectedNetworkFilter, setSelectedNetworkFilter] = useState<IndexPath>(
    {
      section: 0,
      row: 0
    }
  )

  const [selectedContentTypeFilter, setSelectedContentTypeFilter] =
    useState<IndexPath>({
      section: 0,
      row: 0
    })

  const [selectedSort, setSelectedSort] = useState<IndexPath>({
    section: 0,
    row: 2
  })

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
      onSelected: setSelectedSort
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

  const getFilteredNetworks = useCallback(
    (items: NftItem[]) => {
      switch (filterOption[0]) {
        case AssetNetworkFilter.AvalancheCChain:
          return items.filter(
            collectible =>
              'chainId' in collectible &&
              (collectible.chainId === ChainId.AVALANCHE_MAINNET_ID ||
                collectible.chainId === ChainId.AVALANCHE_TESTNET_ID)
          )
        case AssetNetworkFilter.Ethereum:
          return items.filter(
            collectible =>
              'chainId' in collectible &&
              (collectible.chainId === ChainId.ETHEREUM_HOMESTEAD ||
                collectible.chainId === ChainId.ETHEREUM_TEST_GOERLY ||
                collectible.chainId === ChainId.ETHEREUM_TEST_SEPOLIA)
          )
        default:
          return items
      }
    },
    [filterOption]
  )

  const getFilteredContentType = useCallback(
    (items: NftItem[]) => {
      switch (filterOption[1]) {
        case CollectibleTypeFilter.Videos:
          return items.filter(
            collectible => collectible.imageData?.type === NftContentType.MP4
          )
        case CollectibleTypeFilter.Pictures:
          return items.filter(
            collectible =>
              collectible.imageData?.type === NftContentType.JPG ||
              collectible.imageData?.type === NftContentType.PNG ||
              // try to display as picture if the type is unknown
              collectible.imageData?.type === NftContentType.Unknown
          )
        case CollectibleTypeFilter.GIFs:
          return items.filter(
            collectible => collectible.imageData?.type === NftContentType.GIF
          )
        default:
          return items
      }
    },
    [filterOption]
  )

  const getFiltered = useCallback(
    (nfts: NftItem[]) => {
      if (nfts.length === 0) {
        return []
      }
      const filteredByHidden = nfts.filter((nft: NftItem) => {
        if (filterOption[1] !== CollectibleStatus.Hidden) {
          return isCollectibleVisible(collectiblesVisibility, nft)
        }
        return true
      })
      const filteredNetworks = getFilteredNetworks(filteredByHidden)
      return getFilteredContentType(filteredNetworks)
    },
    [
      getFilteredNetworks,
      getFilteredContentType,
      filterOption,
      collectiblesVisibility
    ]
  )

  const getSorted = useCallback(
    (filtered: NftItem[]) => {
      if (sortOption === CollectibleSort.NameAToZ)
        return filtered?.sort((a, b) => {
          return (a.processedMetadata?.name ?? '') <
            (b.processedMetadata?.name ?? '')
            ? 1
            : -1
        })

      if (sortOption === CollectibleSort.NameZToA)
        return filtered?.sort((a, b) => {
          return (a.processedMetadata?.name ?? '') >
            (b.processedMetadata?.name ?? '')
            ? 1
            : -1
        })

      return filtered
    },
    [sortOption]
  )

  const onResetFilter = (): void => {
    setSelectedNetworkFilter({ section: 0, row: 0 })
    setSelectedContentTypeFilter({ section: 0, row: 0 })
  }

  const filteredAndSorted = useMemo(() => {
    const filtered = getFiltered(collectibles)
    return getSorted(filtered)
  }, [collectibles, getFiltered, getSorted])

  return {
    filteredAndSorted,
    filter: filter as DropdownSelection & { selected: IndexPath[] },
    sort,
    view,
    onResetFilter
  }
}

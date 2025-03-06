import { ChainId } from '@avalabs/core-chains-sdk'
import { IndexPath } from '@avalabs/k2-alpine'
import { useCallback, useMemo, useState } from 'react'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
import {
  COLLECTIBLE_FILTERS,
  COLLECTIBLE_SORTS,
  COLLECTIBLE_VIEWS,
  CollectibleNetworkFilter,
  CollectibleSort,
  CollectibleTypeFilter
} from 'store/balance'
import { NftContentType, NFTItem } from 'store/nft'

export type Selection = {
  title: string
  data: string[][]
  selected: IndexPath | IndexPath[]
  onSelected: (index: IndexPath) => void
  onDeselect?: (index: IndexPath) => void
}

export const useFilterAndSort = (
  collectibles: NFTItem[]
): {
  filteredAndSorted: NFTItem[]
  filter: Selection
  sort: Selection
  view: Selection
  onResetFilter: () => void
} => {
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
      ] ?? CollectibleNetworkFilter.AllNetworks,
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

  const filter: Selection = useMemo(
    () => ({
      title: 'Filter',
      data: COLLECTIBLE_FILTERS,
      selected: [selectedNetworkFilter, selectedContentTypeFilter],
      onSelected: (value: IndexPath) => {
        if (value.section === 0) setSelectedNetworkFilter(value)
        else if (value.section === 1) setSelectedContentTypeFilter(value)
      },
      onDeselect: (value: IndexPath) => {
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
    (items: NFTItem[]) => {
      switch (filterOption[0]) {
        case CollectibleNetworkFilter.AvalancheCChain:
          return items.filter(
            collectible =>
              'chainId' in collectible &&
              collectible.chainId &&
              isAvalancheCChainId(Number(collectible.chainId))
          )
        case CollectibleNetworkFilter.Ethereum:
          return items.filter(
            collectible =>
              'chainId' in collectible &&
              (Number(collectible.chainId) === ChainId.ETHEREUM_HOMESTEAD ||
                Number(collectible.chainId) === ChainId.ETHEREUM_TEST_GOERLY ||
                Number(collectible.chainId) === ChainId.ETHEREUM_TEST_SEPOLIA)
          )
        case CollectibleNetworkFilter.BitcoinNetwork:
          return items.filter(
            collectible =>
              'chainId' in collectible &&
              (Number(collectible.chainId) === ChainId.BITCOIN ||
                Number(collectible.chainId) === ChainId.BITCOIN_TESTNET)
          )
        default:
          return items
      }
    },
    [filterOption]
  )

  const getFilteredContentType = useCallback(
    (items: NFTItem[]) => {
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
    (nfts: NFTItem[]) => {
      if (nfts.length === 0) {
        return []
      }
      const filteredNetworks = getFilteredNetworks(nfts)
      return getFilteredContentType(filteredNetworks)
    },
    [getFilteredNetworks, getFilteredContentType]
  )

  const getSorted = useCallback(
    (filtered: NFTItem[]) => {
      if (sortOption === CollectibleSort.NameAToZ)
        return filtered?.sort((a, b) => {
          return (a.processedMetadata?.name ?? '') >
            (b.processedMetadata?.name ?? '')
            ? 1
            : -1
        })

      if (sortOption === CollectibleSort.NameZToA)
        return filtered?.sort((a, b) => {
          return (a.processedMetadata?.name ?? '') <
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
    filter,
    sort,
    view,
    onResetFilter
  }
}

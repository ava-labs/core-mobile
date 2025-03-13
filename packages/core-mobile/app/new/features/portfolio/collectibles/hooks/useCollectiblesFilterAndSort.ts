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
import { isCollectibleVisible } from 'store/nft/utils'
import { selectCollectibleVisibility } from 'store/portfolio'
import { getFilteredContentType, getFilteredNetworks } from '../consts'

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
      const filteredNetworks = getFilteredNetworks(
        filteredByHidden,
        filterOption[0] as AssetNetworkFilter
      )
      return getFilteredContentType(
        filteredNetworks,
        filterOption[1] as CollectibleTypeFilter
      )
    },
    [filterOption, collectiblesVisibility]
  )

  const getSorted = useCallback(
    (filtered: NftItem[]) => {
      if (sortOption === CollectibleSort.NameAToZ)
        return filtered?.sort((a, b) => {
          return (a?.name ?? '') < (b?.name ?? '') ? 1 : -1
        })

      if (sortOption === CollectibleSort.NameZToA)
        return filtered?.sort((a, b) => {
          return (a?.name ?? '') > (b?.name ?? '') ? 1 : -1
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

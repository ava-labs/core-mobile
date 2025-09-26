import { useCallback, useMemo, useState } from 'react'
import { DropdownSelection } from 'common/types'
import { DropdownGroup } from 'common/components/DropdownMenu'
import { PChainTransaction, SortOrder } from '@avalabs/glacier-sdk'
import { isCompleted, isOnGoing } from 'utils/earn/status'

export const useStakeFilterAndSort = ({
  stakes
}: {
  stakes: PChainTransaction[]
}): {
  data: PChainTransaction[]
  filter: DropdownSelection
  sort: DropdownSelection
  resetFilter: () => void
} => {
  const [selectedFilter, setSelectedFilter] = useState<StakeFilter>(
    StakeFilter.All
  )
  const [selectedSort, setSelectedSort] = useState<SortOrder>(SortOrder.DESC)

  const resetFilter = useCallback(() => {
    setSelectedFilter(StakeFilter.All)
  }, [])

  const getFiltered = useCallback(
    (txs: PChainTransaction[]) => {
      if (txs.length === 0) {
        return []
      }

      const now = new Date()
      return txs.filter(tx => {
        switch (selectedFilter) {
          case StakeFilter.Active:
            return isOnGoing(tx, now)
          case StakeFilter.Completed:
            return isCompleted(tx, now)
          default:
            return true
        }
      })
    },
    [selectedFilter]
  )

  const filtered = useMemo(() => getFiltered(stakes), [getFiltered, stakes])

  const filterData = useMemo(() => {
    return STAKE_FILTERS.map(s => {
      return {
        key: s.key,
        items: s.items.map(i => ({
          id: i.id,
          title: i.title,
          selected: i.id === selectedFilter
        }))
      }
    })
  }, [selectedFilter])

  const sortData = useMemo(() => {
    return STAKE_SORTS.map(s => {
      return {
        key: s.key,
        items: s.items.map(i => ({
          id: i.id,
          title: i.title,
          selected: i.id === selectedSort
        }))
      }
    })
  }, [selectedSort])

  const filter = useMemo(
    () => ({
      title: 'Filter',
      data: filterData,
      selected: selectedFilter,
      onSelected: (value: string) => {
        setSelectedFilter(value as StakeFilter)
      }
    }),
    [filterData, selectedFilter]
  )

  const sort = useMemo(
    () => ({
      title: 'Sort',
      data: sortData,
      selected: selectedSort,
      onSelected: (value: string) => {
        setSelectedSort(value as SortOrder)
      }
    }),
    [sortData, selectedSort]
  )

  return {
    filter,
    sort,
    data: filtered,
    resetFilter
  }
}

export enum StakeFilter {
  All = 'All',
  Active = 'Active',
  Completed = 'Completed'
}

export enum StakeSort {
  NewToOld = 'Newest to oldest',
  OldToNew = 'Oldest to newest'
}

export const STAKE_FILTERS: DropdownGroup[] = [
  {
    key: 'stake-filters',
    items: [
      {
        id: StakeFilter.All,
        title: StakeFilter.All
      },
      {
        id: StakeFilter.Active,
        title: StakeFilter.Active
      },
      {
        id: StakeFilter.Completed,
        title: StakeFilter.Completed
      }
    ]
  }
]

export const STAKE_SORTS: DropdownGroup[] = [
  {
    key: 'stake-sorts',
    items: [
      {
        id: SortOrder.DESC,
        title: StakeSort.NewToOld
      },
      {
        id: SortOrder.ASC,
        title: StakeSort.OldToNew
      }
    ]
  }
]

import { useCallback, useMemo, useState } from 'react'
import { DropdownGroup } from 'common/components/DropdownMenu'
import { DropdownSelection } from 'common/types'
import { BorrowPosition, MarketNames } from '../types'

export const useBorrowsFilterAndSort = ({
  borrows
}: {
  borrows: BorrowPosition[]
}): {
  data: BorrowPosition[]
  filter: DropdownSelection
  sort: DropdownSelection
  resetFilter: () => void
} => {
  const [selectedFilter, setSelectedFilter] = useState<BorrowFilter>(
    BorrowFilter.All
  )
  const [selectedSort, setSelectedSort] = useState<BorrowSortOrder>(
    BorrowSortOrder.HighToLow
  )

  const resetFilter = useCallback(() => {
    setSelectedFilter(BorrowFilter.All)
  }, [])

  const getFiltered = useCallback(
    (items: BorrowPosition[]) => {
      if (items.length === 0) {
        return []
      }

      return items.filter(item => {
        switch (selectedFilter) {
          case BorrowFilter.Aave:
            return item.market.marketName === MarketNames.aave
          case BorrowFilter.Benqi:
            return item.market.marketName === MarketNames.benqi
          default:
            return true
        }
      })
    },
    [selectedFilter]
  )

  const getSorted = useCallback(
    (items: BorrowPosition[]) => {
      const direction = selectedSort === BorrowSortOrder.HighToLow ? -1 : 1
      return [...items].sort((a, b) => {
        if (a.borrowedAmountUsd === b.borrowedAmountUsd) return 0
        return a.borrowedAmountUsd > b.borrowedAmountUsd
          ? direction
          : -direction
      })
    },
    [selectedSort]
  )

  const filteredAndSorted = useMemo(() => {
    const filtered = getFiltered(borrows)
    return getSorted(filtered)
  }, [borrows, getFiltered, getSorted])

  const filterData = useMemo(() => {
    return BORROW_FILTERS.map(group => {
      return {
        key: group.key,
        items: group.items.map(item => ({
          id: item.id,
          title: item.title,
          selected: item.id === selectedFilter
        }))
      }
    })
  }, [selectedFilter])

  const sortData = useMemo(() => {
    return BORROW_SORTS.map(group => {
      return {
        key: group.key,
        items: group.items.map(item => ({
          id: item.id,
          title: item.title,
          selected: item.id === selectedSort
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
        setSelectedFilter(value as BorrowFilter)
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
        setSelectedSort(value as BorrowSortOrder)
      }
    }),
    [sortData, selectedSort]
  )

  return {
    filter,
    sort,
    data: filteredAndSorted,
    resetFilter
  }
}

export enum BorrowFilter {
  All = 'All',
  Aave = 'Aave',
  Benqi = 'Benqi'
}

export enum BorrowSortOrder {
  HighToLow = 'HighToLow',
  LowToHigh = 'LowToHigh'
}

enum BorrowSortTitle {
  HighToLow = 'Highest to lowest',
  LowToHigh = 'Lowest to highest'
}

export const BORROW_FILTERS: DropdownGroup[] = [
  {
    key: 'borrow-filters',
    items: [
      {
        id: BorrowFilter.All,
        title: BorrowFilter.All
      },
      {
        id: BorrowFilter.Aave,
        title: BorrowFilter.Aave
      },
      {
        id: BorrowFilter.Benqi,
        title: BorrowFilter.Benqi
      }
    ]
  }
]

export const BORROW_SORTS: DropdownGroup[] = [
  {
    key: 'borrow-sorts',
    items: [
      {
        id: BorrowSortOrder.HighToLow,
        title: BorrowSortTitle.HighToLow
      },
      {
        id: BorrowSortOrder.LowToHigh,
        title: BorrowSortTitle.LowToHigh
      }
    ]
  }
]

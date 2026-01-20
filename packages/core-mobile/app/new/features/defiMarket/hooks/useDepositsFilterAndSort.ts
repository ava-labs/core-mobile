import { useCallback, useMemo, useState } from 'react'
import { DropdownSelection } from 'common/types'
import { DropdownGroup } from 'common/components/DropdownMenu'
import { DefiMarket, MarketNames } from '../types'

export const useDepositsFilterAndSort = ({
  deposits
}: {
  deposits: DefiMarket[]
}): {
  data: DefiMarket[]
  filter: DropdownSelection
  sort: DropdownSelection
  resetFilter: () => void
} => {
  const [selectedFilter, setSelectedFilter] = useState<DepositFilter>(
    DepositFilter.All
  )
  const [selectedSort, setSelectedSort] = useState<DepositSortOrder>(
    DepositSortOrder.HighToLow
  )

  const resetFilter = useCallback(() => {
    setSelectedFilter(DepositFilter.All)
  }, [])

  const getFiltered = useCallback(
    (items: DefiMarket[]) => {
      if (items.length === 0) {
        return []
      }

      return items.filter(item => {
        switch (selectedFilter) {
          case DepositFilter.Aave:
            return item.marketName === MarketNames.aave
          case DepositFilter.Benqi:
            return item.marketName === MarketNames.benqi
          default:
            return true
        }
      })
    },
    [selectedFilter]
  )

  const getSorted = useCallback(
    (items: DefiMarket[]) => {
      const direction = selectedSort === DepositSortOrder.HighToLow ? -1 : 1
      return [...items].sort((a, b) => {
        const balanceA = a.asset.mintTokenBalance.balanceValue.value
        const balanceB = b.asset.mintTokenBalance.balanceValue.value
        if (balanceA === balanceB) return 0
        return balanceA > balanceB ? direction : -direction
      })
    },
    [selectedSort]
  )

  const filteredAndSorted = useMemo(() => {
    const filtered = getFiltered(deposits)
    return getSorted(filtered)
  }, [getFiltered, getSorted, deposits])

  const filterData = useMemo(() => {
    return DEPOSIT_FILTERS.map(group => {
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
    return DEPOSIT_SORTS.map(group => {
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
        setSelectedFilter(value as DepositFilter)
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
        setSelectedSort(value as DepositSortOrder)
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

export enum DepositFilter {
  All = 'All',
  Aave = 'Aave',
  Benqi = 'Benqi'
}

export enum DepositSortOrder {
  HighToLow = 'HighToLow',
  LowToHigh = 'LowToHigh'
}

enum DepositSortTitle {
  HighToLow = 'Highest to lowest',
  LowToHigh = 'Lowest to highest'
}

export const DEPOSIT_FILTERS: DropdownGroup[] = [
  {
    key: 'deposit-filters',
    items: [
      {
        id: DepositFilter.All,
        title: DepositFilter.All
      },
      {
        id: DepositFilter.Aave,
        title: DepositFilter.Aave
      },
      {
        id: DepositFilter.Benqi,
        title: DepositFilter.Benqi
      }
    ]
  }
]

export const DEPOSIT_SORTS: DropdownGroup[] = [
  {
    key: 'deposit-sorts',
    items: [
      {
        id: DepositSortOrder.HighToLow,
        title: DepositSortTitle.HighToLow
      },
      {
        id: DepositSortOrder.LowToHigh,
        title: DepositSortTitle.LowToHigh
      }
    ]
  }
]

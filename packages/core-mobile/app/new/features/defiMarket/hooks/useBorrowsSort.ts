import { useCallback, useMemo, useState } from 'react'
import { DropdownGroup } from 'common/components/DropdownMenu'
import { DropdownSelection } from 'common/types'
import { BorrowPosition } from '../types'

export const useBorrowsSort = ({
  borrows
}: {
  borrows: BorrowPosition[]
}): {
  data: BorrowPosition[]
  sort: DropdownSelection
} => {
  const [selectedSort, setSelectedSort] = useState<BorrowSortOrder>(
    BorrowSortOrder.HighToLow
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

  const sorted = useMemo(() => {
    return getSorted(borrows)
  }, [borrows, getSorted])

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
    sort,
    data: sorted
  }
}

export enum BorrowSortOrder {
  HighToLow = 'HighToLow',
  LowToHigh = 'LowToHigh'
}

enum BorrowSortTitle {
  HighToLow = 'Highest to lowest',
  LowToHigh = 'Lowest to highest'
}

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

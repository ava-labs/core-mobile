import { DropdownSelection } from 'common/types'
import { advancedFilterDropDownItems } from 'consts/earn'
import { useState, useMemo } from 'react'
import { AdvancedSortFilter } from 'types/earn'

export const useNodeSort = (): DropdownSelection => {
  const [selectedSort, setSelectedSort] = useState<AdvancedSortFilter>(
    AdvancedSortFilter.UpTimeHighToLow
  )

  const data = useMemo(
    () => [
      {
        key: 'node-sort-filters',
        items: advancedFilterDropDownItems.map(f => ({
          id: f.key,
          title: f.key,
          selected: f.key === selectedSort
        }))
      }
    ],
    [selectedSort]
  )

  return {
    title: 'Sort',
    data,
    selected: selectedSort,
    onSelected: (value: string) => {
      setSelectedSort(value as AdvancedSortFilter)
    }
  }
}

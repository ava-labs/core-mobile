import { DropdownSelection } from 'common/types'
import { useMemo, useState } from 'react'
import {
  DELEGATE_NODE_SORT_OPTIONS,
  DelegateNodeSortOption
} from '../utils/sortDelegateNodes'

/**
 * Sort dropdown state for the Delegate node picker. Mirrors core-web's sort
 * menu (see `sortDelegateNodes`); defaults to "Highest APY".
 */
export const useDelegateNodeSort = (): DropdownSelection & {
  selected: DelegateNodeSortOption
} => {
  const [selected, setSelected] = useState<DelegateNodeSortOption>(
    DelegateNodeSortOption.HighestApy
  )

  const data = useMemo(
    () => [
      {
        key: 'delegate-node-sort',
        items: DELEGATE_NODE_SORT_OPTIONS.map(option => ({
          id: option,
          title: option,
          selected: option === selected
        }))
      }
    ],
    [selected]
  )

  return {
    title: 'Sort',
    data,
    selected,
    onSelected: (value: string) => setSelected(value as DelegateNodeSortOption)
  }
}

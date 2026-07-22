import { useCallback, useMemo, useState } from 'react'
import { DropdownSelection } from 'common/types'
import { DropdownGroup } from 'common/components/DropdownMenu'
import { PChainTransaction, SortOrder } from '@avalabs/glacier-sdk'
import { isDelegationTx } from 'features/stake/v2/utils/isDelegationTx'
import { isFastStakeTx } from 'features/stake/v2/utils/isFastStakeTx'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { isCompleted, isOnGoing } from 'utils/earn/status'

export const useStakeFilterAndSort = ({
  stakes,
  includeTypeFilters = false
}: {
  stakes: PChainTransaction[]
  /**
   * Adds the stake-type filters (Fast stakes / Delegation) after the status
   * ones, mirroring core-web's stake-table filter set. Opt-in so the legacy
   * (V1) stake list keeps its original All/Active/Completed choices; the V2
   * home screen turns it on. The two type filters are mutually exclusive,
   * matching the card badges: Fast stakes matches on the convenience-fee
   * escrow output (`isFastStakeTx`), Delegation on txType MINUS fast stakes.
   * Fee-less fast stakes carry no escrow output, so — like their badge —
   * they land under Delegation.
   */
  includeTypeFilters?: boolean
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
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

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
          case StakeFilter.FastStakes:
            return isFastStakeTx(tx, isDeveloperMode)
          case StakeFilter.Delegation:
            return isDelegationTx(tx) && !isFastStakeTx(tx, isDeveloperMode)
          default:
            return true
        }
      })
    },
    [selectedFilter, isDeveloperMode]
  )

  const filtered = useMemo(() => getFiltered(stakes), [getFiltered, stakes])

  const filterData = useMemo(() => {
    const groups = includeTypeFilters ? STAKE_FILTERS_WITH_TYPES : STAKE_FILTERS
    return groups.map(s => {
      return {
        key: s.key,
        items: s.items.map(i => ({
          id: i.id,
          title: i.title,
          selected: i.id === selectedFilter
        }))
      }
    })
  }, [selectedFilter, includeTypeFilters])

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
  Completed = 'Completed',
  // Stake-type filters (V2 home screen only — see `includeTypeFilters`).
  // Labels match core-web's stake-table filter set.
  FastStakes = 'Fast stakes',
  Delegation = 'Delegation'
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

// Status filters plus the stake-type ones, in core-web's order (All, Active,
// Completed, Fast stakes, Delegation — Validation is follow-up work alongside
// the card badge). Used when `includeTypeFilters` is on.
export const STAKE_FILTERS_WITH_TYPES: DropdownGroup[] = [
  {
    key: 'stake-filters',
    items: [
      ...(STAKE_FILTERS[0]?.items ?? []),
      {
        id: StakeFilter.FastStakes,
        title: StakeFilter.FastStakes
      },
      {
        id: StakeFilter.Delegation,
        title: StakeFilter.Delegation
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

import { IndexPath } from '@avalabs/k2-alpine'
import { useCallback, useMemo, useState } from 'react'
import { Transaction } from 'store/transaction'
import {
  PChainTransactionType,
  TransactionType
} from '@avalabs/vm-module-types'
import { sortUndefined } from 'common/utils/sortUndefined'
import { isCollectibleTransaction } from 'features/activity/utils'

export type Selection = {
  title: string
  data: string[][]
  selected: IndexPath
  onSelected: (index: IndexPath) => void
}

export const useTokenDetailFilterAndSort = ({
  transactions,
  filters
}: {
  transactions: Transaction[]
  filters?: TokenDetailFilters
}): {
  data: Transaction[]
  filter: Selection
  sort: Selection
  resetFilter: () => void
} => {
  const [selectedFilter, setSelectedFilter] = useState<IndexPath>({
    section: 0,
    row: 0
  })
  const [selectedSort, setSelectedSort] = useState<IndexPath>({
    section: 0,
    row: 0
  })

  const resetFilter = useCallback(() => {
    setSelectedFilter({ section: 0, row: 0 })
  }, [])

  const filterOption = useMemo(() => {
    return (
      (filters ?? TOKEN_DETAIL_FILTERS)?.[selectedFilter.section]?.[
        selectedFilter.row
      ] ?? TokenDetailFilter.All
    )
  }, [filters, selectedFilter.row, selectedFilter.section])

  const sortOption = useMemo(() => {
    return (
      TOKEN_DETAIL_SORTS?.[selectedSort.section]?.[selectedSort.row] ??
      TokenDetailSort.NewToOld
    )
  }, [selectedSort])

  const getFiltered = useCallback(() => {
    if (transactions.length === 0) {
      return []
    }
    return transactions.filter(tx => {
      switch (filterOption) {
        case TokenDetailFilter.Stake:
          return (
            tx.txType === PChainTransactionType.ADD_PERMISSIONLESS_DELEGATOR_TX
          )
        case TokenDetailFilter.NFT:
          return isCollectibleTransaction(tx)
        case TokenDetailFilter.Received:
          return tx.txType === TransactionType.RECEIVE
        case TokenDetailFilter.Sent:
          return tx.txType === TransactionType.SEND
        case TokenDetailFilter.Bridge:
          return tx.txType === TransactionType.BRIDGE
        case TokenDetailFilter.Swap:
          return (
            tx.txType === TransactionType.SWAP ||
            (tx.isContractCall && tx.tokens.length > 1)
          )
        default:
          return true
      }
    })
  }, [filterOption, transactions])

  const getSorted = useCallback(
    (txs: Transaction[]) => {
      if (sortOption === TokenDetailSort.OldToNew) {
        return txs?.sort((a, b) => sortUndefined(a.timestamp, b.timestamp))
      }
      return txs?.sort((a, b) => sortUndefined(b.timestamp, a.timestamp))
    },
    [sortOption]
  )

  const filteredAndSorted = useMemo(() => {
    const filtered = getFiltered()
    return getSorted(filtered)
  }, [getFiltered, getSorted])

  const filter = useMemo(
    () => ({
      title: 'Filter',
      data: filters ?? TOKEN_DETAIL_FILTERS,
      selected: selectedFilter,
      onSelected: setSelectedFilter
    }),
    [filters, selectedFilter]
  )

  const sort = useMemo(
    () => ({
      title: 'Sort',
      data: TOKEN_DETAIL_SORTS,
      selected: selectedSort,
      onSelected: setSelectedSort
    }),
    [selectedSort]
  )

  return {
    filter,
    sort,
    data: filteredAndSorted,
    resetFilter
  }
}

// Token Detail
export enum TokenDetailFilter {
  All = 'All',
  Sent = 'Sent',
  Received = 'Received',
  Bridge = 'Bridge',
  Swap = 'Swap',
  Stake = 'Stake',
  NFT = 'NFT'
}

export enum TokenDetailSort {
  NewToOld = 'Newest to oldest',
  OldToNew = 'Oldest to newest'
}

export type TokenDetailFilters = TokenDetailFilter[][]
type TokenDetailSorts = TokenDetailSort[][]

export const TOKEN_DETAIL_FILTERS: TokenDetailFilters = [
  [
    TokenDetailFilter.All,
    TokenDetailFilter.Sent,
    TokenDetailFilter.Received,
    TokenDetailFilter.Swap,
    TokenDetailFilter.Bridge
  ]
]

const TOKEN_DETAIL_SORTS: TokenDetailSorts = [
  [TokenDetailSort.NewToOld, TokenDetailSort.OldToNew]
]

import { IndexPath } from '@avalabs/k2-alpine'
import { useCallback, useMemo, useState } from 'react'
import { Transaction } from 'store/transaction'
import { TransactionType } from '@avalabs/vm-module-types'
import { sortUndefined } from 'common/utils/sortUndefined'

export type Selection = {
  title: string
  data: string[][]
  selected: IndexPath
  onSelected: (index: IndexPath) => void
}

export const useTokenDetailFilterAndSort = ({
  transactions
}: {
  transactions: Transaction[]
}): {
  data: Transaction[]
  filter: Selection
  sort: Selection
} => {
  const [selectedFilter, setSelectedFilter] = useState<IndexPath>({
    section: 0,
    row: 0
  })
  const [selectedSort, setSelectedSort] = useState<IndexPath>({
    section: 0,
    row: 0
  })

  const filterOption = useMemo(() => {
    return (
      TOKEN_DETAIL_FILTERS?.[selectedFilter.section]?.[selectedFilter.row] ??
      TokenDetailFilter.All
    )
  }, [selectedFilter])

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
        case TokenDetailFilter.Received:
          return tx.isIncoming && tx.txType !== TransactionType.BRIDGE
        case TokenDetailFilter.Sent:
          return tx.isOutgoing
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

  return {
    filter: {
      title: 'Filter',
      data: TOKEN_DETAIL_FILTERS,
      selected: selectedFilter,
      onSelected: setSelectedFilter
    },
    sort: {
      title: 'Sort',
      data: TOKEN_DETAIL_SORTS,
      selected: selectedSort,
      onSelected: setSelectedSort
    },
    data: filteredAndSorted
  }
}

// Token Detail
export enum TokenDetailFilter {
  All = 'All',
  Sent = 'Sent',
  Received = 'Received',
  Bridge = 'Bridge',
  Swap = 'Swap'
}

export enum TokenDetailSort {
  NewToOld = 'Newest to oldest',
  OldToNew = 'Oldest to newest'
}

type TokenDetailFilters = TokenDetailFilter[][]
type TokenDetailSorts = TokenDetailSort[][]

const TOKEN_DETAIL_FILTERS: TokenDetailFilters = [
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

import { useCallback, useMemo, useState } from 'react'
import { Transaction } from 'store/transaction'
import {
  PChainTransactionType,
  TransactionType
} from '@avalabs/vm-module-types'
import { sortUndefined } from 'common/utils/sortUndefined'
import { DropdownSelection } from 'common/types'
import { isCollectibleTransaction } from 'features/activity/utils'
import { DropdownGroup } from 'common/components/DropdownMenu'
import { fixUnknownTxType } from '../components/TokenActivityListItem'

export const useTokenDetailFilterAndSort = ({
  transactions,
  filters
}: {
  transactions: Transaction[]
  filters?: DropdownGroup[]
}): {
  data: Transaction[]
  filter: DropdownSelection
  sort: DropdownSelection
  resetFilter: () => void
} => {
  const [selectedFilter, setSelectedFilter] = useState<TokenDetailFilter>(
    TokenDetailFilter.All
  )
  const [selectedSort, setSelectedSort] = useState<TokenDetailSort>(
    TokenDetailSort.NewToOld
  )

  const resetFilter = useCallback(() => {
    setSelectedFilter(TokenDetailFilter.All)
  }, [])

  const sortOption = useMemo(() => {
    return selectedSort ?? TokenDetailSort.NewToOld
  }, [selectedSort])

  const getFiltered = useCallback(() => {
    if (transactions.length === 0) {
      return []
    }
    return transactions.filter(tx => {
      switch (selectedFilter) {
        case TokenDetailFilter.Stake:
          return (
            tx.txType === PChainTransactionType.ADD_PERMISSIONLESS_DELEGATOR_TX
          )
        case TokenDetailFilter.NFT:
          return isCollectibleTransaction(tx)
        case TokenDetailFilter.Received:
          if (isCollectibleTransaction(tx)) {
            return !tx.isSender
          }
          return fixUnknownTxType(tx) === TransactionType.RECEIVE
        case TokenDetailFilter.Sent:
          if (isCollectibleTransaction(tx)) {
            return tx.isSender
          }
          return fixUnknownTxType(tx) === TransactionType.SEND
        case TokenDetailFilter.Bridge:
          return tx.txType === TransactionType.BRIDGE
        case TokenDetailFilter.Swap:
          return (
            tx.txType === TransactionType.SWAP ||
            fixUnknownTxType(tx) === TransactionType.SWAP
          )

        default:
          return true
      }
    })
  }, [selectedFilter, transactions])

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

  const filterData = useMemo(() => {
    return (filters ?? TOKEN_DETAIL_FILTERS).map(s => {
      return {
        key: s.key,
        items: s.items.map(i => ({
          id: i.id,
          title: i.id,
          selected: i.id === selectedFilter
        }))
      }
    })
  }, [filters, selectedFilter])

  const sortData = useMemo(
    () => [
      {
        key: 'token-detail-sorts',
        items: TOKEN_DETAIL_SORTS.map(f => ({
          id: f.items.find(i => i.id === selectedSort)?.id ?? '',
          title: f.items.find(i => i.id === selectedSort)?.title ?? '',
          selected:
            f.items.find(i => i.id === selectedSort)?.id === selectedSort
        }))
      }
    ],
    [selectedSort]
  )

  const filter = useMemo(
    () => ({
      title: 'Filter',
      data: filterData,
      selected: selectedFilter,
      onSelected: (value: string) => {
        setSelectedFilter(value as TokenDetailFilter)
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
        setSelectedSort(value as TokenDetailSort)
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

export const TOKEN_DETAIL_FILTERS: DropdownGroup[] = [
  {
    key: 'token-detail-filters',
    items: [
      {
        id: TokenDetailFilter.All,
        title: TokenDetailFilter.All
      },
      {
        id: TokenDetailFilter.Sent,
        title: TokenDetailFilter.Sent
      },
      {
        id: TokenDetailFilter.Received,
        title: TokenDetailFilter.Received
      },
      {
        id: TokenDetailFilter.Swap,
        title: TokenDetailFilter.Swap
      },
      {
        id: TokenDetailFilter.Bridge,
        title: TokenDetailFilter.Bridge
      }
    ]
  }
]

export const TOKEN_DETAIL_SORTS: DropdownGroup[] = [
  {
    key: 'token-detail-sorts',
    items: [
      {
        id: TokenDetailSort.NewToOld,
        title: TokenDetailSort.NewToOld
      },
      {
        id: TokenDetailSort.OldToNew,
        title: TokenDetailSort.OldToNew
      }
    ]
  }
]

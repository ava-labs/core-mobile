import {
  PChainTransactionType,
  TransactionType
} from '@avalabs/vm-module-types'
import { DropdownGroup } from 'common/components/DropdownMenu'
import { DropdownSelection } from 'common/types'
import { sortUndefined } from 'common/utils/sortUndefined'
import { isCollectibleTransaction } from 'features/activity/utils'
import { useCallback, useMemo, useState } from 'react'
import { Transaction } from 'store/transaction'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { fixUnknownTxType } from '../components/TokenActivityListItem'
import { isTxSentFromAccount } from 'features/portfolio/utils'

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
  const account = useSelector(selectActiveAccount)
  const [selectedFilter, setSelectedFilter] = useState<TokenDetailFilter>(
    TokenDetailFilter.All
  )
  const [selectedSort, setSelectedSort] = useState<TokenDetailSort>(
    TokenDetailSort.NewToOld
  )

  const resetFilter = useCallback(() => {
    setSelectedFilter(TokenDetailFilter.All)
  }, [])

  // eslint-disable-next-line sonarjs/cognitive-complexity
  const getFiltered = useCallback(() => {
    if (transactions.length === 0) {
      return []
    }
    return transactions.filter(tx => {
      const isFromAccount = isTxSentFromAccount(tx.from, account)
      switch (selectedFilter) {
        case TokenDetailFilter.Imported:
          return tx.txType === PChainTransactionType.IMPORT_TX
        case TokenDetailFilter.Exported:
          return tx.txType === PChainTransactionType.EXPORT_TX
        case TokenDetailFilter.Stake:
          return (
            tx.txType === PChainTransactionType.ADD_PERMISSIONLESS_DELEGATOR_TX
          )
        case TokenDetailFilter.NFT:
          return isCollectibleTransaction(tx)
        case TokenDetailFilter.Received:
          if (tx.txType === PChainTransactionType.BASE_TX) {
            return tx.isIncoming
          }
          if (isCollectibleTransaction(tx)) {
            return !tx.isSender
          }
          return fixUnknownTxType(tx, isFromAccount) === TransactionType.RECEIVE
        case TokenDetailFilter.Sent:
          if (tx.txType === PChainTransactionType.BASE_TX) {
            return tx.isOutgoing
          }
          if (isCollectibleTransaction(tx)) {
            return tx.isSender
          }
          return fixUnknownTxType(tx, isFromAccount) === TransactionType.SEND
        case TokenDetailFilter.Bridge:
          return tx.txType === TransactionType.BRIDGE
        case TokenDetailFilter.Swap:
          return (
            tx.txType === TransactionType.SWAP ||
            fixUnknownTxType(tx, isFromAccount) === TransactionType.SWAP
          )

        default:
          return true
      }
    })
  }, [selectedFilter, transactions])

  const getSorted = useCallback(
    (txs: Transaction[]) => {
      if (selectedSort === TokenDetailSort.OldToNew) {
        return txs?.sort((a, b) => sortUndefined(a.timestamp, b.timestamp))
      }
      return txs?.sort((a, b) => sortUndefined(b.timestamp, a.timestamp))
    },
    [selectedSort]
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

  const sortData = useMemo(() => {
    return TOKEN_DETAIL_SORTS.map(s => {
      return {
        key: s.key,
        items: s.items.map(i => ({
          id: i.id,
          title: i.id,
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
  NFT = 'NFT',
  Imported = 'Imported',
  Exported = 'Exported'
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

import { BridgeTransfer } from '@avalabs/bridge-unified'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { ChainId, Network } from '@avalabs/core-chains-sdk'
import { IndexPath } from '@avalabs/k2-alpine'
import { TokenWithBalance, TransactionType } from '@avalabs/vm-module-types'
import { useErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { DropdownSelection } from 'common/types'
import usePendingBridgeTransactions from 'features/bridge/hooks/usePendingBridgeTransactions'
import {
  Selection,
  TOKEN_DETAIL_FILTERS,
  TokenDetailFilter,
  TokenDetailFilters,
  useTokenDetailFilterAndSort
} from 'features/portfolio/assets/hooks/useTokenDetailFilterAndSort'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useCallback, useEffect, useMemo } from 'react'
import { isAvalancheNetwork } from 'services/network/utils/isAvalancheNetwork'
import { Transaction } from 'store/transaction'
import { useGetRecentTransactions } from 'store/transaction/hooks/useGetRecentTransactions'
import { isPChain, isXChain } from 'utils/network/isAvalancheNetwork'
import { useActivity } from '../store'
import { ActivityListItem, buildGroupedData, getDateGroups } from '../utils'

type ActivityNetworkFilter = {
  filterName: string
  chainId: number
}

export const useActivityFilterAndSearch = ({
  searchText
}: {
  searchText: string
}): {
  data: ActivityListItem[]
  sort: Selection
  filter: Selection
  network: Network
  networkOption?: ActivityNetworkFilter
  networkFilterDropdown: DropdownSelection & {
    scrollContentMaxHeight: number
  }
  networkFilters: ActivityNetworkFilter[]
  selectedNetwork: IndexPath
  isLoading: boolean
  isRefreshing: boolean
  isError: boolean
  xpToken: TokenWithBalance | undefined
  refresh: () => void
  setSelectedNetwork: (network: IndexPath) => void
} => {
  const { enabledNetworks, getNetwork } = useNetworks()
  const { selectedNetwork, setSelectedNetwork } = useActivity()

  const erc20ContractTokens = useErc20ContractTokens()
  const { filteredTokenList } = useSearchableTokenList({
    tokens: erc20ContractTokens
  })

  const networkFilters: ActivityNetworkFilter[] = useMemo(() => {
    return enabledNetworks.map(network => ({
      filterName: isAvalancheNetwork(network)
        ? `Avalanche C-Chain ${
            network.chainId === ChainId.AVALANCHE_TESTNET_ID ? 'Testnet' : ''
          }`
        : network.chainName,
      chainId: network.chainId
    }))
  }, [enabledNetworks])

  const networkOption: ActivityNetworkFilter | undefined = useMemo(() => {
    return (
      [networkFilters]?.[selectedNetwork.section]?.[selectedNetwork.row] ||
      networkFilters[0]
    )
  }, [networkFilters, selectedNetwork.row, selectedNetwork.section])

  const network = useMemo(() => {
    return getNetwork(networkOption?.chainId)
  }, [getNetwork, networkOption?.chainId])

  const xpToken = useMemo(() => {
    return filteredTokenList.find(tk => {
      return (
        networkOption?.chainId &&
        (isPChain(networkOption?.chainId) ||
          isXChain(networkOption?.chainId)) &&
        Number(tk.networkChainId) === Number(networkOption?.chainId)
      )
    })
  }, [filteredTokenList, networkOption?.chainId])

  const { transactions, refresh, isLoading, isRefreshing, isError } =
    useGetRecentTransactions(network)

  const pendingBridgeTxs = usePendingBridgeTransactions(networkOption?.chainId)
  const isPendingBridge = useCallback(
    (tx: Transaction) => {
      return (
        tx.txType === TransactionType.BRIDGE &&
        pendingBridgeTxs.some(
          bridge =>
            (bridge.sourceTxHash === tx.hash ||
              (!!bridge.targetTxHash && bridge.targetTxHash === tx.hash)) &&
            Boolean(bridge.completedAt) === false
        )
      )
    },
    [pendingBridgeTxs]
  )

  const transactionsBySymbol = useMemo(() => {
    return (
      transactions
        // Remove transaction with empty token array
        .filter(tx => tx.tokens.length > 0)
        .filter(tx => !isPendingBridge(tx))
    )
  }, [transactions, isPendingBridge])

  const filters: TokenDetailFilters | undefined = useMemo(() => {
    if (networkOption?.chainId && isPChain(networkOption?.chainId)) {
      const newFilters = [
        ...(TOKEN_DETAIL_FILTERS[0] ?? []),
        TokenDetailFilter.Stake
      ]
      return [newFilters]
    }
    return undefined
  }, [networkOption?.chainId])

  const { data, filter, sort, resetFilter } = useTokenDetailFilterAndSort({
    transactions: transactionsBySymbol,
    filters
  })

  const networkFilterDropdown = useMemo(() => {
    return {
      network,
      title: networkOption?.filterName ?? '',
      data: [networkFilters.map(f => f.filterName)],
      selected: selectedNetwork,
      onSelected: setSelectedNetwork,
      scrollContentMaxHeight: 250
    }
  }, [
    network,
    networkFilters,
    networkOption?.filterName,
    selectedNetwork,
    setSelectedNetwork
  ])

  useEffect(() => {
    // In case the user is searching and the filter is not the default one, reset the filter
    if (searchText.length > 0 && filter.title !== TokenDetailFilter.All) {
      resetFilter()
    }
  }, [
    filter.selected.row,
    filter.selected.section,
    filter.title,
    resetFilter,
    searchText.length
  ])

  const combinedData = useMemo(() => {
    const filteredPendingBridgeTxs = pendingBridgeTxs.toSorted(
      (a, b) => b.sourceStartedAt - a.sourceStartedAt
    )

    if (searchText.length > 0) {
      const filteredTransactions = data.filter(tx =>
        filterTransactionBySearch(tx, searchText)
      )
      const filteredPendingBridge = filteredPendingBridgeTxs.filter(tx =>
        filterPendingBridgeBySearch(tx, searchText)
      )
      const { todayTxs, monthGroups } = getDateGroups(filteredTransactions)
      return buildGroupedData(todayTxs, monthGroups, filteredPendingBridge)
    }

    const { todayTxs, monthGroups } = getDateGroups(data)
    return buildGroupedData(todayTxs, monthGroups, filteredPendingBridgeTxs)
  }, [data, searchText, pendingBridgeTxs])

  return {
    data: combinedData as ActivityListItem[],
    xpToken,
    sort,
    filter,
    isLoading,
    isRefreshing,
    isError,
    refresh,
    network: network as Network,
    networkOption,
    networkFilters,
    setSelectedNetwork,
    selectedNetwork,
    networkFilterDropdown
  }
}

function filterTransactionBySearch(tx: Transaction, search: string): boolean {
  const searchLower = search.toLowerCase()
  return (
    tx.tokens.some(t =>
      [
        t.symbol,
        t.name,
        t.amount.toString(),
        t.from,
        t.to,
        t.type.toString()
      ].some(field =>
        typeof field === 'string'
          ? field.toLowerCase().includes(searchLower)
          : false
      )
    ) ||
    [tx.hash, tx.to, tx.from].some(field =>
      field.toLowerCase().includes(searchLower)
    )
  )
}

function filterPendingBridgeBySearch(
  tx: BridgeTransaction | BridgeTransfer,
  search: string
): boolean {
  const searchLower = search.toLowerCase()

  return Boolean(
    tx.sourceTxHash.toLowerCase().includes(searchLower) ||
      tx.targetTxHash?.toLowerCase().includes(searchLower)
  )
}

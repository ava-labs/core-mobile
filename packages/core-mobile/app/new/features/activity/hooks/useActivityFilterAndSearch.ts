import { BridgeTransfer } from '@avalabs/bridge-unified'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { ChainId, Network } from '@avalabs/core-chains-sdk'
import { IndexPath } from '@avalabs/k2-alpine'
import { TokenWithBalance, TransactionType } from '@avalabs/vm-module-types'
import { useErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { getBridgeAssetSymbol } from 'common/utils/bridgeUtils'
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
  networkFilters: ActivityNetworkFilter[]
  networkDropdown: Selection & {
    scrollContentMaxHeight: number
  }
  selectedNetwork: IndexPath
  isLoading: boolean
  isRefreshing: boolean
  isError: boolean
  refresh: () => void
  xpToken: TokenWithBalance | undefined
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
        (isPChain(network?.chainId as ChainId) ||
          isXChain(network?.chainId as ChainId)) &&
        Number(tk.networkChainId) === Number(network?.chainId)
      )
    })
  }, [filteredTokenList, network?.chainId])

  const networkDropdown: Selection & {
    scrollContentMaxHeight: number
  } = useMemo(() => {
    return {
      title: 'Network',
      data: [networkFilters.map(f => f.filterName)],
      selected: selectedNetwork,
      onSelected: setSelectedNetwork,
      scrollContentMaxHeight: 250
    }
  }, [networkFilters, selectedNetwork, setSelectedNetwork])

  const { transactions, refresh, isLoading, isRefreshing, isError } =
    useGetRecentTransactions(network)

  const pendingBridgeTxs = usePendingBridgeTransactions(network?.chainId)
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
        .filter(tx => tx.tokens.length)
        .filter(tx => !isPendingBridge(tx))
    )
  }, [transactions, isPendingBridge])

  const filters: TokenDetailFilters | undefined = useMemo(() => {
    if (network?.chainId && isPChain(network.chainId)) {
      const newFilters = [
        ...(TOKEN_DETAIL_FILTERS[0] ?? []),
        TokenDetailFilter.Stake
      ]
      return [newFilters]
    }
    return undefined
  }, [network?.chainId])

  const { data, filter, sort, resetFilter } = useTokenDetailFilterAndSort({
    transactions: transactionsBySymbol,
    filters
  })

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

  // Helper functions for filtering
  const filterTransactionBySearch = useCallback(
    (tx: Transaction, search: string) => {
      const searchLower = search.toLowerCase()
      return (
        tx.tokens.some(t =>
          [t.symbol, t.name, t.amount.toString()].some(field =>
            field.toLowerCase().includes(searchLower)
          )
        ) ||
        [tx.hash, tx.to, tx.from].some(field =>
          field.toLowerCase().includes(searchLower)
        )
      )
    },
    []
  )

  const filterPendingBridgeBySearch = useCallback(
    (tx: BridgeTransaction | BridgeTransfer, search: string) => {
      const searchLower = search.toLowerCase()
      return (
        tx.sourceTxHash.toLowerCase().includes(searchLower) ||
        tx.targetTxHash?.toLowerCase().includes(searchLower)
      )
    },
    []
  )

  const combinedData = useMemo(() => {
    const filteredPendingBridgeTxs = pendingBridgeTxs
      .toSorted((a, b) => b.sourceStartedAt - a.sourceStartedAt)
      .filter(tx => getBridgeAssetSymbol(tx) === network?.networkToken?.symbol)

    const filteredTransactions =
      searchText.length > 0
        ? data.filter(tx => filterTransactionBySearch(tx, searchText))
        : data

    const filteredPendingBridge =
      searchText.length > 0
        ? filteredPendingBridgeTxs.filter(tx =>
            filterPendingBridgeBySearch(tx, searchText)
          )
        : filteredPendingBridgeTxs

    const { todayTxs, monthGroups } = getDateGroups(filteredTransactions)
    return buildGroupedData(todayTxs, monthGroups, filteredPendingBridge)
  }, [
    data,
    searchText,
    pendingBridgeTxs,
    network?.networkToken?.symbol,
    filterTransactionBySearch,
    filterPendingBridgeBySearch
  ])

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
    networkDropdown,
    selectedNetwork
  }
}

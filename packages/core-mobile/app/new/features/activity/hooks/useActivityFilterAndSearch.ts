import { BridgeTransfer } from '@avalabs/bridge-unified'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { ChainId, Network } from '@avalabs/core-chains-sdk'
import { TokenWithBalance, TransactionType } from '@avalabs/vm-module-types'
import { DropdownSelection } from 'common/types'
import usePendingBridgeTransactions from 'features/bridge/hooks/usePendingBridgeTransactions'
import {
  TOKEN_DETAIL_FILTERS,
  TokenDetailFilter,
  useTokenDetailFilterAndSort
} from 'features/portfolio/assets/hooks/useTokenDetailFilterAndSort'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useCallback, useEffect, useMemo } from 'react'
import { isAvalancheNetwork } from 'services/network/utils/isAvalancheNetwork'
import { Transaction } from 'store/transaction'
import { useGetRecentTransactions } from 'store/transaction/hooks/useGetRecentTransactions'
import { isPChain, isXChain } from 'utils/network/isAvalancheNetwork'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { useErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { DropdownGroup } from 'common/components/DropdownMenu'
import { useActivity } from '../store'
import { ActivityListItem, buildGroupedData, getDateGroups } from '../utils'
import { isSupportedNftChainId } from '../utils'

export type ActivityNetworkFilter = {
  filterName: string
  chainId?: number
}

export const useActivityFilterAndSearch = ({
  searchText
}: {
  searchText: string
}): {
  data: ActivityListItem[]
  sort: DropdownSelection
  filter: DropdownSelection
  network: Network
  networkFilterDropdown: DropdownSelection
  networkFilters: ActivityNetworkFilter[]
  selectedNetwork?: ActivityNetworkFilter
  isLoading: boolean
  isRefreshing: boolean
  isError: boolean
  xpToken: TokenWithBalance | undefined
  isXpChain: boolean
  refresh: () => void
  setSelectedNetwork: (network: ActivityNetworkFilter) => void
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

  useEffect(() => {
    if (!selectedNetwork && networkFilters[0]) {
      setSelectedNetwork(networkFilters[0])
    }
  }, [selectedNetwork, setSelectedNetwork, networkFilters])

  const network = useMemo(() => {
    return getNetwork(selectedNetwork?.chainId)
  }, [getNetwork, selectedNetwork?.chainId])

  const isXpChain = useMemo(() => {
    return (
      selectedNetwork?.chainId !== undefined &&
      (isPChain(selectedNetwork?.chainId) || isXChain(selectedNetwork?.chainId))
    )
  }, [selectedNetwork?.chainId])

  const xpToken = useMemo(() => {
    return filteredTokenList.find(tk => {
      return (
        selectedNetwork?.chainId &&
        isXpChain &&
        Number(tk.networkChainId) === Number(selectedNetwork.chainId)
      )
    })
  }, [filteredTokenList, selectedNetwork?.chainId, isXpChain])

  const { transactions, refresh, isLoading, isRefreshing, isError } =
    useGetRecentTransactions(network)

  const pendingBridgeTxs = usePendingBridgeTransactions(
    selectedNetwork?.chainId
  )
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

  const filters: DropdownGroup[] | undefined = useMemo(() => {
    if (selectedNetwork?.chainId) {
      const newFilters = [...(TOKEN_DETAIL_FILTERS[0]?.items ?? [])]
      // Stake filter is only available for P-Chain
      if (isPChain(selectedNetwork?.chainId)) {
        newFilters.push({
          id: TokenDetailFilter.Stake,
          title: TokenDetailFilter.Stake
        })
      }

      // Only Avalanche C-Chain and Ethereum are supported for NFTs
      if (isSupportedNftChainId(selectedNetwork?.chainId)) {
        newFilters.push({
          id: TokenDetailFilter.NFT,
          title: TokenDetailFilter.NFT
        })
      }
      return [
        {
          key: 'token-detail-filters',
          items: newFilters
        }
      ]
    }
  }, [selectedNetwork?.chainId])

  const { data, filter, sort, resetFilter } = useTokenDetailFilterAndSort({
    transactions: transactionsBySymbol,
    filters
  })

  const networkFilterData = useMemo(
    () => [
      {
        key: 'activity-network-filters',
        items: networkFilters.map(f => ({
          id: f.filterName,
          title: f.filterName,
          selected: f.filterName === selectedNetwork?.filterName
        }))
      }
    ],
    [networkFilters, selectedNetwork?.filterName]
  )

  const networkFilterDropdown = useMemo(() => {
    return {
      network,
      title: selectedNetwork?.filterName ?? '',
      data: networkFilterData,
      selected: selectedNetwork?.filterName ?? '',
      onSelected: (value: string) => {
        const n = networkFilters.find(f => f.filterName === value)
        n && setSelectedNetwork(n)
      }
    }
  }, [
    network,
    networkFilterData,
    networkFilters,
    selectedNetwork,
    setSelectedNetwork
  ])

  useEffect(() => {
    // In case the user is searching and the filter is not the default one, reset the filter
    if (searchText.length > 0 && filter.selected !== TokenDetailFilter.All) {
      resetFilter()
    }
  }, [filter.selected, resetFilter, searchText.length])

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
    isLoading: isLoading,
    isRefreshing,
    isError,
    isXpChain,
    refresh,
    network: network as Network,
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

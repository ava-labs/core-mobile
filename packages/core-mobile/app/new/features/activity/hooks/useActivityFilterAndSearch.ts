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

type ActivityNetworkFilter = {
  filterName: string
  chainId: number
}

export const useActivityFilterAndSearch = ({
  searchText
}: {
  searchText: string
}): {
  data: Transaction[]
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
  token: TokenWithBalance | undefined
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

  const token = useMemo(() => {
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

  const combinedData = useMemo(() => {
    const filteredPendingBridgeTxs = pendingBridgeTxs
      .toSorted((a, b) => b.sourceStartedAt - a.sourceStartedAt)
      .filter(tx => getBridgeAssetSymbol(tx) === network?.networkToken?.symbol)

    if (searchText.length) {
      return [
        ...filteredPendingBridgeTxs.filter(tx => {
          return (
            tx.sourceTxHash.toLowerCase().includes(searchText.toLowerCase()) ||
            tx.targetTxHash?.toLowerCase().includes(searchText.toLowerCase())
          )
        }),
        ...data.filter(tx => {
          return (
            tx.tokens.some(t =>
              [t.symbol, t.name, t.amount.toString()].some(field =>
                field.toLowerCase().includes(searchText.toLowerCase())
              )
            ) ||
            tx.hash.toLowerCase().includes(searchText.toLowerCase()) ||
            tx.to.toLowerCase().includes(searchText.toLowerCase()) ||
            tx.from.toLowerCase().includes(searchText.toLowerCase())
          )
        })
      ]
    }

    return [...filteredPendingBridgeTxs, ...data]
  }, [data, network?.networkToken?.symbol, pendingBridgeTxs, searchText])

  return {
    data: combinedData as Transaction[],
    token,
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

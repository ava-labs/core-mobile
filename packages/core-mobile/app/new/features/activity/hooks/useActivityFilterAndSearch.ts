import { ChainId, Network } from '@avalabs/core-chains-sdk'
import { TokenWithBalance } from '@avalabs/vm-module-types'
import { DropdownSelection } from 'common/types'
import {
  TOKEN_DETAIL_FILTERS,
  TokenDetailFilter,
  useTokenDetailFilterAndSort
} from 'features/portfolio/assets/hooks/useTokenDetailFilterAndSort'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useEffect, useMemo } from 'react'
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
import { useLowValueFilteredActivityTransactions } from './useLowValueFilteredActivityTransactions'

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

  const transactionsBySymbol = useMemo(() => {
    // Remove transactions with empty token array
    return transactions.filter(tx => tx.tokens.length > 0)
  }, [transactions])

  const lowValueFilteredTransactions = useLowValueFilteredActivityTransactions(
    transactionsBySymbol,
    network
  )

  const filters: DropdownGroup[] | undefined = useMemo(() => {
    if (selectedNetwork?.chainId) {
      const newFilters = [...(TOKEN_DETAIL_FILTERS[0]?.items ?? [])]

      if (isXpChain) {
        newFilters.push({
          id: TokenDetailFilter.Imported,
          title: TokenDetailFilter.Imported
        })
        newFilters.push({
          id: TokenDetailFilter.Exported,
          title: TokenDetailFilter.Exported
        })

        // Stake filter is only available for P-Chain
        if (isPChain(selectedNetwork?.chainId)) {
          newFilters.push({
            id: TokenDetailFilter.Stake,
            title: TokenDetailFilter.Stake
          })
        }
      } else {
        // Swap and Bridge are only available for non-Xp chains
        newFilters.push({
          id: TokenDetailFilter.Swap,
          title: TokenDetailFilter.Swap
        })
        newFilters.push({
          id: TokenDetailFilter.Bridge,
          title: TokenDetailFilter.Bridge
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
  }, [isXpChain, selectedNetwork?.chainId])

  const { data, filter, sort, resetFilter } = useTokenDetailFilterAndSort({
    transactions: lowValueFilteredTransactions,
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
    // In case the user is changing the network,
    // reset the filter if the selected filter is not in the new filters list
    if (!filters?.some(f => f.items.find(i => filter.selected === i.id))) {
      resetFilter()
    }

    // In case the user is searching we want to keep the default filter (All)
    if (searchText.length > 0 && filter.selected !== TokenDetailFilter.All) {
      resetFilter()
    }
  }, [filter.selected, filters, resetFilter, searchText.length])

  const combinedData = useMemo(() => {
    if (searchText.length > 0) {
      const filteredTransactions = data.filter(tx =>
        filterTransactionBySearch(tx, searchText)
      )
      const { todayTxs, monthGroups } = getDateGroups(filteredTransactions)
      return buildGroupedData(todayTxs, monthGroups)
    }

    const { todayTxs, monthGroups } = getDateGroups(data)
    return buildGroupedData(todayTxs, monthGroups)
  }, [data, searchText])

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

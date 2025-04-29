import { IndexPath } from '@avalabs/k2-alpine'
import { useCallback, useMemo, useState } from 'react'
import {
  ASSET_BALANCE_SORTS,
  ASSET_MANAGE_VIEWS,
  ASSET_NETWORK_FILTERS,
  AssetBalanceSort,
  AssetNetworkFilter,
  LocalTokenWithBalance
} from 'store/balance'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
import { ChainId } from '@avalabs/core-chains-sdk'
import { sortUndefined } from 'common/utils/sortUndefined'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { DropdownSelection } from 'common/types'
import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { useErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { sortedTokensWithBalance } from 'common/utils/sortTokensWithBalance'

export const useAssetsFilterAndSort = (): {
  data: LocalTokenWithBalance[]
  filter: DropdownSelection
  sort: DropdownSelection
  view: DropdownSelection
  refetch: () => void
  isRefetching: boolean
} => {
  const erc20ContractTokens = useErc20ContractTokens()
  const { filteredTokenList, refetch, isRefetching } = useSearchableTokenList({
    tokens: erc20ContractTokens
  })

  const [selectedFilter, setSelectedFilter] = useState<IndexPath>({
    section: 0,
    row: 0
  })
  const [selectedSort, setSelectedSort] = useState<IndexPath>({
    section: 0,
    row: 0
  })
  const [selectedView, setSelectedView] = useState<IndexPath>({
    section: 0,
    row: 1
  })

  const filterOption = useMemo(() => {
    return (
      ASSET_NETWORK_FILTERS?.[selectedFilter.section]?.[selectedFilter.row] ??
      AssetNetworkFilter.AllNetworks
    )
  }, [selectedFilter])

  const sortOption = useMemo(() => {
    return (
      ASSET_BALANCE_SORTS?.[selectedSort.section]?.[selectedSort.row] ??
      AssetBalanceSort.HighToLow
    )
  }, [selectedSort])

  const getFiltered = useCallback(() => {
    if (filteredTokenList.length === 0) {
      return []
    }
    switch (filterOption) {
      case AssetNetworkFilter.AvalancheCChain:
        return filteredTokenList.filter(
          token =>
            ('chainId' in token &&
              token.chainId &&
              isAvalancheCChainId(token.chainId)) ||
            token.localId === 'AvalancheAVAX'
        )
      case AssetNetworkFilter.AvalanchePChain:
        return filteredTokenList.filter(token => isTokenWithBalancePVM(token))
      case AssetNetworkFilter.AvalancheXChain:
        return filteredTokenList.filter(token => isTokenWithBalanceAVM(token))
      case AssetNetworkFilter.Ethereum:
        return filteredTokenList.filter(
          token =>
            'chainId' in token &&
            (token.chainId === ChainId.ETHEREUM_HOMESTEAD ||
              token.chainId === ChainId.ETHEREUM_TEST_GOERLY ||
              token.chainId === ChainId.ETHEREUM_TEST_SEPOLIA)
        )
      case AssetNetworkFilter.BitcoinNetwork:
        return filteredTokenList.filter(token => token.symbol === 'BTC')
      default:
        return filteredTokenList
    }
  }, [filterOption, filteredTokenList])

  const getSorted = useCallback(
    (filtered: LocalTokenWithBalance[]) => {
      if (sortOption === AssetBalanceSort.LowToHigh) {
        return filtered?.toSorted((a, b) =>
          sortUndefined(a.balanceInCurrency, b.balanceInCurrency)
        )
      }

      return filtered?.toSorted((a, b) =>
        sortUndefined(b.balanceInCurrency, a.balanceInCurrency)
      )
    },
    [sortOption]
  )

  const filteredAndSorted = useMemo(() => {
    const filtered = getFiltered()
    // Sort the tokens with balance
    const sorted = getSorted(filtered)
    // Pin the primary tokens to the top of the list
    return sortedTokensWithBalance(sorted)
  }, [getFiltered, getSorted])

  const filter = useMemo(
    () => ({
      title: 'Filter',
      data: ASSET_NETWORK_FILTERS,
      selected: selectedFilter,
      onSelected: setSelectedFilter
    }),
    [selectedFilter, setSelectedFilter]
  )

  const sort = useMemo(
    () => ({
      title: 'Sort',
      data: ASSET_BALANCE_SORTS,
      selected: selectedSort,
      onSelected: setSelectedSort,
      useAnchorRect: true
    }),
    [selectedSort, setSelectedSort]
  )

  const view = useMemo(
    () => ({
      title: 'View',
      data: ASSET_MANAGE_VIEWS,
      selected: selectedView,
      onSelected: setSelectedView
    }),
    [selectedView, setSelectedView]
  )

  return useMemo(
    () => ({
      filter,
      sort,
      view,
      data: filteredAndSorted,
      refetch,
      isRefetching
    }),
    [filter, sort, view, filteredAndSorted, refetch, isRefetching]
  )
}

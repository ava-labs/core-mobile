import { IndexPath } from '@avalabs/k2-alpine'
import { useCallback, useMemo, useState } from 'react'
import {
  ASSET_BALANCE_SORTS,
  ASSET_MANAGE_VIEWS,
  AssetBalanceSort,
  AssetNetworkFilter,
  LocalTokenWithBalance
} from 'store/balance'
import { sortUndefined } from 'common/utils/sortUndefined'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { DropdownSelection } from 'common/types'
import { useErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { sortTokensWithPrimaryFirst } from 'common/utils/sortTokensWithPrimaryFirst'
import { useSelector } from 'react-redux'
import { selectEnabledNetworks } from 'store/network'

export const useAssetsFilterAndSort = (): {
  data: LocalTokenWithBalance[]
  filter: DropdownSelection
  sort: DropdownSelection
  view: DropdownSelection
  refetch: () => void
  isRefetching: boolean
  isLoading: boolean
} => {
  const erc20ContractTokens = useErc20ContractTokens()
  const enabledNetworks = useSelector(selectEnabledNetworks)
  const { filteredTokenList, refetch, isRefetching, isLoading } =
    useSearchableTokenList({
      tokens: erc20ContractTokens
    })

  const networkFilters = useMemo(() => {
    const enabledNetworksFilter = enabledNetworks.map(network => {
      return { filterName: network.chainName, chainId: network.chainId }
    })
    return [
      {
        filterName: AssetNetworkFilter.AllNetworks as string,
        chainId: undefined
      },
      ...enabledNetworksFilter
    ]
  }, [enabledNetworks])

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
    return [networkFilters]?.[selectedFilter.section]?.[selectedFilter.row]
  }, [networkFilters, selectedFilter.row, selectedFilter.section])

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

    if (filterOption?.filterName === AssetNetworkFilter.AllNetworks) {
      return filteredTokenList
    }

    const filteredResult = filteredTokenList.filter(
      token => token.networkChainId === filterOption?.chainId
    )
    return filteredResult === undefined || filteredResult.length === 0
      ? []
      : filteredResult
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
    return sortTokensWithPrimaryFirst({
      tokens: sorted,
      sortOthersByBalance: false
    })
  }, [getFiltered, getSorted])

  const filter = useMemo(
    () => ({
      title: 'Filter',
      data: [networkFilters.map(f => f.filterName)],
      selected: selectedFilter,
      onSelected: setSelectedFilter,
      scrollContentMaxHeight: 250
    }),
    [networkFilters, selectedFilter]
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
      isRefetching,
      isLoading
    }),
    [filter, sort, view, filteredAndSorted, refetch, isRefetching, isLoading]
  )
}

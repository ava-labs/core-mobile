import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ASSET_BALANCE_SORTS,
  ASSET_MANAGE_VIEWS,
  AssetBalanceSort,
  AssetManageView,
  AssetNetworkFilter,
  LocalTokenWithBalance
} from 'store/balance'
import { sortUndefined } from 'common/utils/sortUndefined'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { DropdownSelection } from 'common/types'
import { useErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { useSelector } from 'react-redux'
import { selectEnabledNetworks } from 'store/network'
import { usePrevious } from 'common/hooks/usePrevious'
import { ActivityNetworkFilter } from 'features/activity/hooks/useActivityFilterAndSearch'
import { isEqual } from 'lodash'

export const useAssetsFilterAndSort = (): {
  onResetFilter: () => void
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

  const [selectedNetworkFilters, setSelectedNetworkFilters] =
    useState<ActivityNetworkFilter[]>(networkFilters)

  const prevNetworkFilters = usePrevious(networkFilters)

  useEffect(() => {
    if (isEqual(prevNetworkFilters, networkFilters)) {
      return
    }
    setSelectedNetworkFilters(networkFilters)
  }, [networkFilters, prevNetworkFilters])

  const [selectedFilter, setSelectedFilter] = useState<AssetNetworkFilter>(
    AssetNetworkFilter.AllNetworks
  )
  const [selectedSort, setSelectedSort] = useState<AssetBalanceSort>(
    AssetBalanceSort.HighToLow
  )
  const [selectedView, setSelectedView] = useState<AssetManageView>(
    AssetManageView.List
  )

  const filterOption = useMemo(() => {
    return networkFilters.find(f => f.filterName === selectedFilter)
  }, [networkFilters, selectedFilter])

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
      if (selectedSort === AssetBalanceSort.LowToHigh) {
        return filtered?.toSorted((a, b) =>
          sortUndefined(a.balanceInCurrency, b.balanceInCurrency)
        )
      }

      return filtered?.toSorted((a, b) =>
        sortUndefined(b.balanceInCurrency, a.balanceInCurrency)
      )
    },
    [selectedSort]
  )

  const filteredAndSorted = useMemo(() => {
    const filtered = getFiltered()
    // Sort the tokens with balance
    return getSorted(filtered)
  }, [getFiltered, getSorted])

  const filterData = useMemo(
    () => [
      {
        key: 'network-filters',
        items: selectedNetworkFilters.map(f => ({
          id: f.filterName,
          title: f.filterName,
          selected: f.filterName === selectedFilter
        }))
      }
    ],
    [selectedNetworkFilters, selectedFilter]
  )

  const sortData = useMemo(() => {
    return ASSET_BALANCE_SORTS.map(s => {
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

  const viewData = useMemo(() => {
    return ASSET_MANAGE_VIEWS.map(s => {
      return {
        key: s.key,
        items: s.items.map(i => ({
          id: i.id,
          title: i.id,
          selected: i.id === selectedView
        }))
      }
    })
  }, [selectedView])

  const filter = useMemo(
    () => ({
      title: 'Filter',
      data: filterData,
      selected: selectedFilter,
      onSelected: (value: string) =>
        setSelectedFilter(value as AssetNetworkFilter)
    }),
    [filterData, selectedFilter]
  )

  const sort = useMemo(
    () => ({
      title: 'Sort',
      data: sortData,
      selected: selectedSort,
      onSelected: (value: string) => setSelectedSort(value as AssetBalanceSort)
    }),
    [sortData, selectedSort]
  )

  const view = useMemo(
    () => ({
      title: 'View',
      data: viewData,
      selected: selectedView,
      onSelected: (value: string) => setSelectedView(value as AssetManageView)
    }),
    [viewData, selectedView]
  )

  const onResetFilter = useCallback((): void => {
    setSelectedFilter(AssetNetworkFilter.AllNetworks)
  }, [])

  return useMemo(
    () => ({
      onResetFilter,
      filter,
      sort,
      view,
      data: filteredAndSorted,
      refetch,
      isRefetching,
      isLoading
    }),
    [
      onResetFilter,
      filter,
      sort,
      view,
      filteredAndSorted,
      refetch,
      isRefetching,
      isLoading
    ]
  )
}

import { useCallback, useMemo, useState } from 'react'
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
      // {
      //   filterName: '4234',
      //   chainId: 4234
      // },
      // {
      //   filterName: '423423',
      //   chainId: 423423
      // },
      // {
      //   filterName: '42334',
      //   chainId: 4234
      // },
      // {
      //   filterName: '4234233',
      //   chainId: 423423
      // },
      // {
      //   filterName: '42234',
      //   chainId: 4234
      // },
      // {
      //   filterName: '4232423',
      //   chainId: 423423
      // },
      // {
      //   filterName: '14232423',
      //   chainId: 423423
      // },
      // {
      //   filterName: '422232423',
      //   chainId: 423423
      // },
      // {
      //   filterName: '42223d2423',
      //   chainId: 423423
      // },
      // {
      //   filterName: '42223324232',
      //   chainId: 423423
      // },
      // {
      //   filterName: '422233244232',
      //   chainId: 423423
      // },
      // {
      //   filterName: '42223324df4232',
      //   chainId: 423423
      // },
      // {
      //   filterName: '4222332fd4df4232',
      //   chainId: 423423
      // },
      // {
      //   filterName: '4222332fdd4df4232',
      //   chainId: 423423
      // },
      // {
      //   filterName: '4222332fdad4df4232',
      //   chainId: 423423
      // },
    ]
  }, [enabledNetworks])

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

  const sortOption = useMemo(() => {
    return ASSET_BALANCE_SORTS.flatMap(s => s.items).find(
      s => s.id === selectedSort
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
      if (sortOption?.id === AssetBalanceSort.LowToHigh) {
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
    return getSorted(filtered)
  }, [getFiltered, getSorted])

  const filterData = useMemo(
    () => [
      {
        key: 'network-filters',
        items: networkFilters.map(f => ({
          id: f.filterName,
          title: f.filterName,
          selected: f.filterName === selectedFilter
        }))
      }
    ],
    [networkFilters, selectedFilter]
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

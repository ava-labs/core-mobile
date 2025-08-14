import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { DeFiChain, DeFiSimpleProtocol } from 'services/defi/types'
import { useDeFiChainList } from 'hooks/defi/useDeFiChainList'
import { useDeFiProtocolList } from 'hooks/defi/useDeFiProtocolList'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useNetworks } from 'hooks/networks/useNetworks'
import { DropdownSelection } from 'common/types'
import {
  DEFI_SORT_OPTIONS,
  DEFI_VIEW_OPTIONS,
  DeFiSortOption,
  DeFiViewOption
} from '../types'

export const useDeFiProtocols = (): {
  data: DeFiSimpleProtocol[]
  sort: DropdownSelection
  view: DropdownSelection
  isLoading: boolean
  isRefreshing: boolean
  isSuccess: boolean
  isPaused: boolean
  pullToRefresh: () => void
  refetch: () => void
  error: unknown
  chainList: Record<string, DeFiChain> | undefined
} => {
  const { data: chainList } = useDeFiChainList()
  const {
    data,
    isLoading,
    error,
    pullToRefresh,
    refetch,
    isRefreshing,
    isPaused,
    isSuccess
  } = useDeFiProtocolList()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { networks } = useNetworks()

  const [selectedSort, setSelectedSort] = useState<DeFiSortOption>(
    DeFiSortOption.NameAtoZ
  )
  const [selectedView, setSelectedView] = useState<DeFiViewOption>(
    DeFiViewOption.GridView
  )

  const filteredProtocols = useMemo(() => {
    if (!data) return []

    const filtered = data.filter(protocol => {
      // https://docs.cloud.debank.com/en/readme/api-pro-reference/chain
      // each protocol has a "chain" property which is not a chain id but the abbreviation of the chain name
      // we need to map this to the chain id to get the network object
      const chainId = chainList?.[protocol.chain]?.communityId

      if (chainId) {
        return isDeveloperMode === networks[chainId]?.isTestnet
      }
      return false
    })

    return filtered.sort((a, b) => {
      const aName = a.name ?? ''
      const bName = b.name ?? ''
      if (selectedSort === DeFiSortOption.NameAtoZ) {
        return aName.localeCompare(bName)
      }
      if (selectedSort === DeFiSortOption.NameZtoA) {
        return bName.localeCompare(aName)
      }
      return 0
    })
  }, [data, chainList, networks, isDeveloperMode, selectedSort])

  const sortData = useMemo(
    () => [
      {
        key: DEFI_SORT_OPTIONS.key,
        items: DEFI_SORT_OPTIONS.items.map(i => ({
          ...i,
          selected: i.id === selectedSort
        }))
      }
    ],
    [selectedSort]
  )

  const viewData = useMemo(
    () => [
      {
        key: DEFI_VIEW_OPTIONS.key,
        items: DEFI_VIEW_OPTIONS.items.map(i => ({
          ...i,
          selected: i.id === selectedView
        }))
      }
    ],
    [selectedView]
  )

  return {
    sort: {
      title: 'Sort',
      data: sortData,
      selected: selectedSort,
      onSelected: (value: string) => {
        setSelectedSort(value as DeFiSortOption)
      }
    },
    view: {
      title: 'View',
      data: viewData,
      selected: selectedView,
      onSelected: (value: string) => {
        setSelectedView(value as DeFiViewOption)
      }
    },
    data: filteredProtocols,
    isSuccess,
    isLoading,
    isRefreshing,
    isPaused,
    pullToRefresh,
    refetch,
    error,
    chainList
  }
}

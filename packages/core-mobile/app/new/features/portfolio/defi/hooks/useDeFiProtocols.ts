import { IndexPath } from '@avalabs/k2-alpine'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { DeFiChain, DeFiSimpleProtocol } from 'services/defi/types'
import { useDeFiChainList } from 'hooks/defi/useDeFiChainList'
import { useDeFiProtocolList } from 'hooks/defi/useDeFiProtocolList'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useNetworks } from 'hooks/networks/useNetworks'
import { DropdownSelection } from 'common/types'
import { DEFI_SORT_OPTIONS, DEFI_VIEW_OPTIONS, DeFiSortOption } from '../types'

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
  const isDeveloperModeEnabled = useSelector(selectIsDeveloperMode)
  const { networks } = useNetworks()

  const [selectedSort, setSelectedSort] = useState<IndexPath>({
    section: 0,
    row: 0
  })
  const [selectedView, setSelectedView] = useState<IndexPath>({
    section: 0,
    row: 0
  })

  const sortOption = useMemo(() => {
    return (
      DEFI_SORT_OPTIONS?.[selectedSort.section]?.[selectedSort.row] ??
      DeFiSortOption.NameAtoZ
    )
  }, [selectedSort])

  const onSelectedView = (indexPath: IndexPath): void => {
    setSelectedView(indexPath)
  }

  const filteredProtocols = useMemo(() => {
    if (!data) return []

    const filtered = data.filter(protocol => {
      // https://docs.cloud.debank.com/en/readme/api-pro-reference/chain
      // each protocol has a "chain" property which is not a chain id but the abbreviation of the chain name
      // we need to map this to the chain id to get the network object
      const chainId = chainList?.[protocol.chain]?.communityId

      if (chainId) {
        return isDeveloperModeEnabled === networks[chainId]?.isTestnet
      }
      return false
    })

    return filtered.sort((a, b) => {
      const aName = a.name ?? ''
      const bName = b.name ?? ''
      if (sortOption === DeFiSortOption.NameAtoZ) {
        return aName.localeCompare(bName)
      }
      if (sortOption === DeFiSortOption.NameZtoA) {
        return bName.localeCompare(aName)
      }
      return 0
    })
  }, [data, chainList, networks, isDeveloperModeEnabled, sortOption])

  return {
    sort: {
      title: 'Sort',
      data: DEFI_SORT_OPTIONS,
      selected: selectedSort,
      useAnchorRect: true,
      onSelected: setSelectedSort
    },
    view: {
      title: 'View',
      data: DEFI_VIEW_OPTIONS,
      selected: selectedView,
      onSelected: onSelectedView
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

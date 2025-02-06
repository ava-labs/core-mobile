import { IndexPath } from '@avalabs/k2-alpine'
import { useMemo, useState } from 'react'
import { LocalTokenWithBalance } from 'store/balance'
import { sortUndefined } from 'common/utils/sortUndefined'
import {
  ASSET_BALANCE_SORTS,
  ASSET_NETWORK_FILTERS,
  AssetBalanceSort,
  AssetNetworkFilter
} from './AssetsDrowndown'

export const useFilterAndSort = (
  tokens: LocalTokenWithBalance[]
): {
  selectedFilter: IndexPath
  setSelectedFilter: (index: IndexPath) => void
  selectedSort: IndexPath
  setSelectedSort: (index: IndexPath) => void
  sorted: LocalTokenWithBalance[]
} => {
  const [selectedFilter, setSelectedFilter] = useState<IndexPath>({
    section: 0,
    row: 0
  })

  const [selectedSort, setSelectedSort] = useState<IndexPath>({
    section: 0,
    row: 0
  })

  const filtered = useMemo(() => {
    const filter =
      ASSET_NETWORK_FILTERS?.[selectedFilter.section]?.[selectedFilter.row]

    if (filter === AssetNetworkFilter.AvalancheCChain) {
      return tokens.filter(
        token =>
          'chainId' in token &&
          (token.chainId === 43114 || token.chainId === 43113)
      )
    }
    if (filter === AssetNetworkFilter.Ethereum) {
      return tokens.filter(
        token =>
          'chainId' in token &&
          (token.chainId === 1 ||
            token.chainId === 5 ||
            token.chainId === 11155111)
      )
    }
    if (filter === AssetNetworkFilter.BitcoinNetwork) {
      return tokens.filter(token => token.symbol === 'BTC')
    }
    return tokens
  }, [selectedFilter, tokens])

  const sorted = useMemo(() => {
    const sort = ASSET_BALANCE_SORTS?.[selectedSort.section]?.[selectedSort.row]

    if (sort === AssetBalanceSort.LowToHigh) {
      return filtered?.sort((a, b) =>
        sortUndefined(a.balanceInCurrency, b.balanceInCurrency)
      )
    }

    return filtered?.sort((a, b) =>
      sortUndefined(b.balanceInCurrency, a.balanceInCurrency)
    )
  }, [filtered, selectedSort])

  return {
    selectedFilter,
    setSelectedFilter,
    selectedSort,
    setSelectedSort,
    sorted
  }
}

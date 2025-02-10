import React from 'react'

import { IndexPath, SimpleDropdown, FilterButton } from '@avalabs/k2-alpine'

export enum AssetNetworkFilter {
  AllNetworks = 'All networks',
  AvalancheCChain = 'Avalanche C-Chain',
  BitcoinNetwork = 'Bitcoin network',
  Ethereum = 'Ethereum'
}
export enum AssetBalanceSort {
  HighToLow = 'High to low balance',
  LowToHigh = 'Low to high balance'
}

export const ASSET_NETWORK_FILTERS: AssetNetworkFilters = [
  [
    AssetNetworkFilter.AllNetworks,
    AssetNetworkFilter.AvalancheCChain,
    AssetNetworkFilter.BitcoinNetwork,
    AssetNetworkFilter.Ethereum
  ]
]
export const ASSET_BALANCE_SORTS: AssetBalanceSorts = [
  [AssetBalanceSort.HighToLow, AssetBalanceSort.LowToHigh]
]

export type AssetBalanceSorts = AssetBalanceSort[][]
export type AssetNetworkFilters = AssetNetworkFilter[][]

interface Props {
  name: string
  options: (AssetBalanceSort | AssetNetworkFilter)[][]
  selectedValue: IndexPath
  setSelectedValue: (indexPath: IndexPath) => void
}

export function AssetsDropdown({
  name,
  options,
  selectedValue,
  setSelectedValue
}: Props): React.JSX.Element {
  return (
    <SimpleDropdown
      from={<FilterButton title={name} />}
      offset={10}
      sections={options}
      selectedRows={[selectedValue]}
      onSelectRow={setSelectedValue}
    />
  )
}

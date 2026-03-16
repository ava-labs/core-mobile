import React from 'react'
import { SelectNetworkScreen } from 'common/screens/SelectNetworkScreen'
import { useBridgeSelectedSourceNetwork } from '../store/store'
import { useBridgeSourceNetworks } from '../hooks/useBridgeNetworks'

export const SelectSourceNetworkScreen = (): JSX.Element => {
  const networks = useBridgeSourceNetworks()
  const [selectedNetwork, setSelectedNetwork] = useBridgeSelectedSourceNetwork()

  return (
    <SelectNetworkScreen
      networks={networks}
      selected={selectedNetwork}
      onSelect={setSelectedNetwork}
    />
  )
}

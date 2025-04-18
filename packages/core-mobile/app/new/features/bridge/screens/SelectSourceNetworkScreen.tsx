import React from 'react'
import { SelectNetworkScreen } from 'common/screens/SelectNetworkScreen'
import { useBridgeSourceNetworks } from 'screens/bridge/hooks/useBridgeNetworks'
import { useBridgeSelectedSourceNetwork } from '../store/store'

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

import React from 'react'
import { SelectNetworkScreen } from 'common/screens/SelectNetworkScreen'
import { useCombinedPrimaryNetworks } from 'common/hooks/useCombinedPrimaryNetworks'
import { useReceiveSelectedNetwork } from '../store'

export const SelectReceiveNetworkScreen = (): JSX.Element => {
  const { networks } = useCombinedPrimaryNetworks()
  const [selectedNetwork, setSelectedNetwork] = useReceiveSelectedNetwork()

  return (
    <SelectNetworkScreen
      networks={networks}
      selected={selectedNetwork}
      onSelect={setSelectedNetwork}
    />
  )
}

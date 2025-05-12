import React from 'react'
import { SelectNetworkScreen } from 'common/screens/SelectNetworkScreen'
import { usePrimaryNetworks } from 'common/hooks/usePrimaryNetworks'
import { useReceiveSelectedNetwork } from '../store'

export const SelectReceiveNetworkScreen = (): JSX.Element => {
  const { networks } = usePrimaryNetworks()
  const [selectedNetwork, setSelectedNetwork] = useReceiveSelectedNetwork()

  return (
    <SelectNetworkScreen
      networks={networks}
      selected={selectedNetwork}
      onSelect={setSelectedNetwork}
    />
  )
}

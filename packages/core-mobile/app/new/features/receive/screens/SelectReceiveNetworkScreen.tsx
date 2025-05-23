import React from 'react'
import { SelectNetworkScreen } from 'common/screens/SelectNetworkScreen'
import { useNetworksByAddress } from 'common/hooks/useNetworksByAddress'
import { useReceiveSelectedNetwork } from '../store'

export const SelectReceiveNetworkScreen = (): JSX.Element => {
  const { networks } = useNetworksByAddress()
  const [selectedNetwork, setSelectedNetwork] = useReceiveSelectedNetwork()

  return (
    <SelectNetworkScreen
      networks={networks}
      selected={selectedNetwork}
      onSelect={setSelectedNetwork}
    />
  )
}

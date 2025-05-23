import React from 'react'
import { SelectNetworkScreen } from 'common/screens/SelectNetworkScreen'
import { useMergedNetworks } from 'common/hooks/useMergedNetworks'
import { useReceiveSelectedNetwork } from '../store'

export const SelectReceiveNetworkScreen = (): JSX.Element => {
  const { networks } = useMergedNetworks()
  const [selectedNetwork, setSelectedNetwork] = useReceiveSelectedNetwork()

  return (
    <SelectNetworkScreen
      networks={networks}
      selected={selectedNetwork}
      onSelect={setSelectedNetwork}
    />
  )
}

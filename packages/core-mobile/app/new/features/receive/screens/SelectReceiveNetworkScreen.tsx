import React from 'react'
import { SelectNetworkScreen } from 'common/screens/SelectNetworkScreen'
import { usePrimaryNetworks } from 'common/hooks/usePrimaryNetworks'
import { useL2Networks } from 'common/hooks/useL2Networks'
import { useReceiveSelectedNetwork } from '../store'

export const SelectReceiveNetworkScreen = (): JSX.Element => {
  const { networks } = usePrimaryNetworks()
  const { networks: l2Networks } = useL2Networks()
  const [selectedNetwork, setSelectedNetwork] = useReceiveSelectedNetwork()

  return (
    <SelectNetworkScreen
      networks={networks.concat(l2Networks)}
      selected={selectedNetwork}
      onSelect={setSelectedNetwork}
    />
  )
}

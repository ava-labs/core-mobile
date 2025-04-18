import React from 'react'
import { SelectNetworkScreen } from 'common/screens/SelectNetworkScreen'
import { usePrimaryNetworks } from 'common/hooks/usePrimaryNetworks'
import {
  SelectedNetworkKey,
  useSelectedNetwork
} from 'common/store/selectedNetwork'

export const SelectReceiveNetworkScreen = (): JSX.Element => {
  const { networks } = usePrimaryNetworks()
  const [selectedNetwork, setSelectedNetwork] = useSelectedNetwork(
    SelectedNetworkKey.RECEIVE
  )

  return (
    <SelectNetworkScreen
      networks={networks}
      selected={selectedNetwork}
      onSelect={setSelectedNetwork}
    />
  )
}

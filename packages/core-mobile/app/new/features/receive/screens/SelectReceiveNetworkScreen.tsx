import React from 'react'
import { SelectNetworkScreen } from 'common/screens/SelectNetworkScreen'
import { usePrimaryNetworks } from 'common/hooks/usePrimaryNetworks'
import { useL2Networks } from 'common/hooks/useL2Networks'
import { useSelector } from 'react-redux'
import { selectEnabledChainIds } from 'store/network'
import { useReceiveSelectedNetwork } from '../store'

export const SelectReceiveNetworkScreen = (): JSX.Element => {
  const { networks } = usePrimaryNetworks()
  const { networks: l2Networks } = useL2Networks()
  const [selectedNetwork, setSelectedNetwork] = useReceiveSelectedNetwork()
  const enabledChainIds = useSelector(selectEnabledChainIds)

  const enabledL2Networks = l2Networks.filter(network =>
    enabledChainIds.includes(network.chainId)
  )

  return (
    <SelectNetworkScreen
      networks={networks.concat(enabledL2Networks)}
      selected={selectedNetwork}
      onSelect={setSelectedNetwork}
    />
  )
}

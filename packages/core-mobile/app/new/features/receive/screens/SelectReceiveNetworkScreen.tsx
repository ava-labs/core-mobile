import React, { useMemo } from 'react'
import { SelectNetworkScreen } from 'common/screens/SelectNetworkScreen'
import { useCombinedPrimaryNetworks } from 'common/hooks/useCombinedPrimaryNetworks'
import { selectActiveAccount } from 'store/account'
import { useSelector } from 'react-redux'
import { NetworkVMType } from '@avalabs/vm-module-types'
import { useReceiveSelectedNetwork } from '../store'

export const SelectReceiveNetworkScreen = (): JSX.Element => {
  const { networks } = useCombinedPrimaryNetworks()
  const activeAccount = useSelector(selectActiveAccount)
  const [selectedNetwork, setSelectedNetwork] = useReceiveSelectedNetwork()

  const filteredNetworks = useMemo(() => {
    if (
      activeAccount?.addressAVM === undefined ||
      activeAccount?.addressPVM === undefined
    ) {
      return networks.filter(
        network =>
          network.vmName !== NetworkVMType.AVM &&
          network.vmName !== NetworkVMType.PVM
      )
    }
    return networks
  }, [networks, activeAccount])

  return (
    <SelectNetworkScreen
      networks={filteredNetworks}
      selected={selectedNetwork}
      onSelect={setSelectedNetwork}
      isReceiveScreen
    />
  )
}

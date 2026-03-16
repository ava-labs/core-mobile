import React from 'react'
import { SelectNetworkScreen } from 'common/screens/SelectNetworkScreen'
import { useLocalSearchParams } from 'expo-router'
import { useBridgeSelectedTargetNetwork } from '../store/store'
import { useNetworksFromCaip2ChainIds } from '../hooks/useBridgeNetworks'

export const SelectTargetNetworkScreen = (): JSX.Element => {
  const { targetChainIds } = useLocalSearchParams<{ targetChainIds: string }>()
  const [selectedNetwork, setSelectedNetwork] = useBridgeSelectedTargetNetwork()

  const networks = useNetworksFromCaip2ChainIds(
    JSON.parse(targetChainIds) ?? []
  )

  return (
    <SelectNetworkScreen
      networks={networks}
      selected={selectedNetwork}
      onSelect={setSelectedNetwork}
    />
  )
}

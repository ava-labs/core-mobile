import { Network } from '@avalabs/core-chains-sdk'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useMemo } from 'react'
import { getAvalancheNetwork } from 'services/network/utils/providerUtils'

const useCChainNetwork = (): Network | undefined => {
  const { activeNetwork, networks } = useNetworks()

  return useMemo(
    () => getAvalancheNetwork(networks, activeNetwork.isTestnet),
    [activeNetwork, networks]
  )
}

export default useCChainNetwork

import { Network } from '@avalabs/core-chains-sdk'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useMemo } from 'react'
import { getAvalancheNetwork } from 'services/network/utils/providerUtils'
import { isDevnet } from 'utils/isDevnet'

const useCChainNetwork = (): Network | undefined => {
  const { activeNetwork, networks } = useNetworks()

  return useMemo(
    () =>
      getAvalancheNetwork(
        networks,
        activeNetwork.isTestnet,
        isDevnet(activeNetwork)
      ),
    [activeNetwork, networks]
  )
}

export default useCChainNetwork

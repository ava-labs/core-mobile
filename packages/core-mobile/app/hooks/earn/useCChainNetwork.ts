import { ChainId, Network } from '@avalabs/chains-sdk'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useMemo } from 'react'

const useCChainNetwork = (): Network | undefined => {
  const { activeNetwork, getNetwork } = useNetworks()

  return useMemo(
    () =>
      getNetwork(
        activeNetwork.isTestnet
          ? ChainId.AVALANCHE_TESTNET_ID
          : ChainId.AVALANCHE_MAINNET_ID
      ),
    [activeNetwork, getNetwork]
  )
}

export default useCChainNetwork

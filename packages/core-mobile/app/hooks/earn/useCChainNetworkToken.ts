import { ChainId, NetworkToken } from '@avalabs/chains-sdk'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useMemo } from 'react'

const useCChainNetworkToken = (): NetworkToken | undefined => {
  const { activeNetwork, getNetwork } = useNetworks()

  return useMemo(
    () =>
      getNetwork(
        activeNetwork.isTestnet
          ? ChainId.AVALANCHE_TESTNET_ID
          : ChainId.AVALANCHE_MAINNET_ID
      )?.networkToken,
    [activeNetwork, getNetwork]
  )
}

export default useCChainNetworkToken

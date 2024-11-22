import { Blockchain, usePriceForChain } from '@avalabs/core-bridge-sdk'
import { Chain } from '@avalabs/bridge-unified'
import Big from 'big.js'
import { useMemo } from 'react'
import { useNetworks } from 'hooks/networks/useNetworks'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import { networkToBlockchain } from '../utils/bridgeUtils'

export const useBridgeNetworkPrice = (chain?: Blockchain | Chain): Big => {
  const { networks } = useNetworks()

  const blockchain = useMemo(() => {
    // Standardize input to Blockchain type
    if (!chain) {
      return undefined
    }

    if (typeof chain === 'object') {
      const chainId = getChainIdFromCaip2(chain.chainId)
      if (!chainId) {
        return undefined
      }

      const network = networks[chainId]

      if (!network) {
        return undefined
      }

      return networkToBlockchain(network)
    }

    return chain
  }, [chain, networks])

  return usePriceForChain(blockchain)
}

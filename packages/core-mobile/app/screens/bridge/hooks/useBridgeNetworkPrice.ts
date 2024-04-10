import { Blockchain, usePriceForChain } from '@avalabs/bridge-sdk'
import { Chain } from '@avalabs/bridge-unified'
import Big from 'big.js'
import { useMemo } from 'react'
import { caipToChainId } from 'utils/data/caip'
import { useNetworks } from 'hooks/useNetworks'
import { networkToBlockchain } from '../utils/bridgeUtils'

export const useBridgeNetworkPrice = (chain?: Blockchain | Chain): Big => {
  const { selectNetworks } = useNetworks()
  const networks = selectNetworks()

  const blockchain = useMemo(() => {
    // Standardize input to Blockchain type
    if (!chain) {
      return undefined
    }

    if (typeof chain === 'object') {
      const network = networks[caipToChainId(chain.chainId)]

      if (!network) {
        return undefined
      }

      return networkToBlockchain(network)
    }

    return chain
  }, [chain, networks])

  return usePriceForChain(blockchain)
}

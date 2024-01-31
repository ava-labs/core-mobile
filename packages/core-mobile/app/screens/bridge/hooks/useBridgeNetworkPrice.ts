import { Blockchain, usePriceForChain } from '@avalabs/bridge-sdk'
import { Chain } from '@avalabs/bridge-unified'
import Big from 'big.js'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectNetworks } from 'store/network'
import { caipToChainId } from 'utils/data/caip'
import { networkToBlockchain } from '../utils/bridgeUtils'

export const useBridgeNetworkPrice = (chain?: Blockchain | Chain): Big => {
  const networks = useSelector(selectNetworks)

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

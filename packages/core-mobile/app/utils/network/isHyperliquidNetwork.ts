import { Network } from '@avalabs/core-chains-sdk'
import { Networks } from 'store/network/types'

export const HYPEREVM_CHAIN_ID = 999
// synthetic Core list id used by the backend for HyperCore — not an EVM chain id
export const HYPERCORE_CHAIN_ID = 9999

export const HYPEREVM_CHAIN_NAME = 'HyperEVM'
export const HYPERCORE_CHAIN_NAME = 'HyperCore'

export function isHyperliquidChainId(chainId: number): boolean {
  return chainId === HYPEREVM_CHAIN_ID || chainId === HYPERCORE_CHAIN_ID
}

export function isHyperliquidNetwork(network?: Network): boolean {
  if (!network) {
    return false
  }

  const normalizedChainName = network.chainName?.trim().toLowerCase()

  return (
    isHyperliquidChainId(network.chainId) ||
    normalizedChainName === HYPEREVM_CHAIN_NAME.toLowerCase() ||
    normalizedChainName === HYPERCORE_CHAIN_NAME.toLowerCase()
  )
}

/**
 * Strips Hyperliquid networks from a backend network map. Applied at the read
 * layer (not at fetch time) so the cached /networks response stays unfiltered
 * and flipping the hyperliquid-support flag never forces a refetch.
 */
export function filterOutHyperliquidNetworks(networks: Networks): Networks {
  return Object.entries(networks).reduce((acc, [chainId, network]) => {
    if (!isHyperliquidNetwork(network)) {
      acc[Number(chainId)] = network
    }
    return acc
  }, {} as Networks)
}

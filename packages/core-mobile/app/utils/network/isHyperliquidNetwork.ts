import { Network } from '@avalabs/core-chains-sdk'

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

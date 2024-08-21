import { BlockchainNamespace } from 'store/rpc/types'
import { getAvalancheCaip2ChainId } from 'temp/caip2ChainIds'

// prefix eip155 namespace to a chainId
// '1' -> 'eip155:1'
export const addNamespaceToChain = (chainId: number): string => {
  const caip2ChainId = getAvalancheCaip2ChainId(chainId)
  if (caip2ChainId) {
    return caip2ChainId
  }

  return `${BlockchainNamespace.EIP155}:${chainId}`
}

// prefix eip155 namespace and chainId to an address
// '0x241b0073b66bfc19FCB54308861f604F5Eb8f51b' -> 'eip155:1:0x241b0073b66bfc19FCB54308861f604F5Eb8f51b'
export const addNamespaceToAddress = (
  address: string,
  chainId: number
): string => {
  const caip2ChainId = getAvalancheCaip2ChainId(chainId)
  if (caip2ChainId) {
    return `${caip2ChainId}:${address}`
  }

  return `${BlockchainNamespace.EIP155}:${chainId}:${address}`
}

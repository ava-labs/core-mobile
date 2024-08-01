import { ChainId, Network } from '@avalabs/core-chains-sdk'

export function isSwimmer(network: Network): boolean {
  return isSwimmerByChainId(network.chainId)
}

export function isSwimmerByChainId(chainId: number): boolean {
  return chainId === ChainId.SWIMMER || chainId === ChainId.SWIMMER_TESTNET
}

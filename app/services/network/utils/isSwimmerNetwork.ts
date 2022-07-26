import { ChainId, Network } from '@avalabs/chains-sdk'

export function isSwimmer(network: Network) {
  return isSwimmerByChainId(network.chainId)
}

export function isSwimmerByChainId(chainId: number) {
  return chainId === ChainId.SWIMMER || chainId === ChainId.SWIMMER_TESTNET
}

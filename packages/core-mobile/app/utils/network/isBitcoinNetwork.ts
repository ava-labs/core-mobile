import { Network, ChainId } from '@avalabs/core-chains-sdk'

export function isBitcoinNetwork(network: Network): boolean {
  return isBitcoinChainId(network.chainId)
}

export function isBitcoinChainId(chainId: number): boolean {
  return ChainId.BITCOIN === chainId || ChainId.BITCOIN_TESTNET === chainId
}

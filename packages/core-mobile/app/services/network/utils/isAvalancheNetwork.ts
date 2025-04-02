import { Network, ChainId } from '@avalabs/core-chains-sdk'

export function isAvalancheNetwork(network: Network): boolean {
  return isAvalancheCChainId(network.chainId)
}

export function isAvalancheCChainId(chainId: number): boolean {
  return (
    ChainId.AVALANCHE_MAINNET_ID === chainId ||
    ChainId.AVALANCHE_TESTNET_ID === chainId ||
    ChainId.AVALANCHE_LOCAL_ID === chainId
  )
}

export function isAvalancheChainId(chainId: number): boolean {
  return [
    ChainId.AVALANCHE_MAINNET_ID,
    ChainId.AVALANCHE_TESTNET_ID,
    ChainId.AVALANCHE_LOCAL_ID,
    ChainId.AVALANCHE_X,
    ChainId.AVALANCHE_TEST_X,
    ChainId.AVALANCHE_P,
    ChainId.AVALANCHE_TEST_P
  ].includes(chainId)
}

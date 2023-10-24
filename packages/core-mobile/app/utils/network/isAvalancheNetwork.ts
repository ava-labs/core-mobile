import { Network, ChainId } from '@avalabs/chains-sdk'

export function isAvalancheNetwork(network: Network) {
  return isAvalancheChainId(network.chainId)
}

export function isAvalancheChainId(chainId: number) {
  return (
    ChainId.AVALANCHE_MAINNET_ID === chainId ||
    ChainId.AVALANCHE_LOCAL_ID === chainId ||
    ChainId.AVALANCHE_TESTNET_ID === chainId
  )
}

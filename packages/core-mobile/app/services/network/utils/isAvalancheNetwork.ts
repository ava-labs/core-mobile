import { Network, ChainId } from '@avalabs/core-chains-sdk'
import { absoluteChain } from 'utils/network/isAvalancheNetwork'

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
  return (
    ChainId.AVALANCHE_MAINNET_ID === chainId ||
    ChainId.AVALANCHE_TESTNET_ID === chainId ||
    ChainId.AVALANCHE_LOCAL_ID === chainId ||
    ChainId.AVALANCHE_XP === absoluteChain(chainId) ||
    ChainId.AVALANCHE_TEST_XP === absoluteChain(chainId)
  )
}

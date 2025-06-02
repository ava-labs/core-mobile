import { Network } from '@avalabs/core-chains-sdk'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
import { isEthereumChainId } from 'services/network/utils/isEthereumNetwork'
import { isPChain, isXChain } from 'utils/network/isAvalancheNetwork'
import { isBitcoinChainId } from 'utils/network/isBitcoinNetwork'
import { isSolanaNetwork } from 'utils/network/isSolanaNetwork'

export function sortPrimaryNetworks(a: Network, b: Network): number {
  if (isAvalancheCChainId(a.chainId)) return -1
  if (isAvalancheCChainId(b.chainId)) return 1
  if (isPChain(a.chainId)) return -1
  if (isPChain(b.chainId)) return 1
  if (isBitcoinChainId(a.chainId)) return -1
  if (isBitcoinChainId(b.chainId)) return 1
  if (isEthereumChainId(a.chainId)) return -1
  if (isEthereumChainId(b.chainId)) return 1
  if (isSolanaNetwork(a)) return -1
  if (isSolanaNetwork(b)) return 1
  if (isXChain(a.chainId)) return -1
  if (isXChain(b.chainId)) return 1
  return 0
}

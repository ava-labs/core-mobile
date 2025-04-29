import { Network } from '@avalabs/core-chains-sdk'
import {
  isAvalancheCChainId,
  isAvalancheChainId
} from 'services/network/utils/isAvalancheNetwork'
import { isEthereumChainId } from 'services/network/utils/isEthereumNetwork'
import { isBitcoinChainId } from 'utils/network/isBitcoinNetwork'

export function sortPrimaryNetworks(a: Network, b: Network): number {
  if (isAvalancheCChainId(a.chainId)) return -1
  if (isAvalancheCChainId(b.chainId)) return 1
  if (isAvalancheChainId(a.chainId)) return -1
  if (isAvalancheChainId(b.chainId)) return 1
  if (isBitcoinChainId(a.chainId)) return -1
  if (isBitcoinChainId(b.chainId)) return 1
  if (isEthereumChainId(a.chainId)) return -1
  if (isEthereumChainId(b.chainId)) return 1
  return 0
}

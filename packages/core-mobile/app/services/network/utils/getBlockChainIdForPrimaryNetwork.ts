import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { BlockchainId } from '@avalabs/glacier-sdk'

export function getBlockChainIdForPrimaryNetwork(
  network: Network
): BlockchainId {
  switch (network.vmName) {
    case NetworkVMType.EVM:
    case NetworkVMType.CoreEth:
      return BlockchainId.C_CHAIN
    case NetworkVMType.AVM:
      return BlockchainId.X_CHAIN
    case NetworkVMType.PVM:
      return BlockchainId.P_CHAIN
    default:
      throw new Error(
        'getBlockChainIdForPrimaryNetwork accepts only primary Avalanche primary networks'
      )
  }
}

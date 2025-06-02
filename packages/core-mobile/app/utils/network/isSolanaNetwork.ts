import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'

export function isSolanaNetwork(network: Network): boolean {
  return network.vmName === NetworkVMType.SVM
}
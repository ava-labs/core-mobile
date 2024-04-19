import { Network, NetworkVMType } from '@avalabs/chains-sdk'

export function isPvmNetwork(network?: Network): boolean {
  return network?.vmName === NetworkVMType.PVM
}

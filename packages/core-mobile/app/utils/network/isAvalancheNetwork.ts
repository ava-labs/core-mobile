import { ChainId, Network, NetworkVMType } from '@avalabs/core-chains-sdk'

export function isPvmNetwork(network?: Network): boolean {
  return network?.vmName === NetworkVMType.PVM
}
export function isAvmNetwork(network?: Network): boolean {
  return network?.vmName === NetworkVMType.AVM
}

export function isXPChain(chainId: number): boolean {
  return isPChain(chainId) || isXChain(chainId)
}

export function isPChain(chainId: number): boolean {
  return [ChainId.AVALANCHE_P, ChainId.AVALANCHE_TEST_P].includes(chainId)
}

export function isXChain(chainId: number): boolean {
  return [ChainId.AVALANCHE_X, ChainId.AVALANCHE_TEST_X].includes(chainId)
}

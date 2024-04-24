import { ChainId, Network, NetworkVMType } from '@avalabs/chains-sdk'

export function isPvmNetwork(network?: Network): boolean {
  return network?.vmName === NetworkVMType.PVM
}

export function isXPChain(chainId: number): boolean {
  return [ChainId.AVALANCHE_XP, ChainId.AVALANCHE_TEST_XP].includes(chainId)
}

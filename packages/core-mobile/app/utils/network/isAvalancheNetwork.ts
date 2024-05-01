import { ChainId, Network, NetworkVMType } from '@avalabs/chains-sdk'

export function isAvalancheNetwork(network?: Network): boolean {
  return network?.vmName === NetworkVMType.PVM
}
export function isAvmNetwork(network?: Network): boolean {
  return network?.vmName === NetworkVMType.AVM
}

export function isXPChain(chainId: number): boolean {
  return [ChainId.AVALANCHE_XP, ChainId.AVALANCHE_TEST_XP].includes(
    absoluteChain(chainId)
  )
}

/**
 * X and P chains have same ID so to differentiate them P chain is -X.
 * To undo this transformation use this function.
 */
export function absoluteChain(chainId: number): number {
  return chainId < 0 ? chainId * -1 : chainId
}

import { NetworkVMType } from '@avalabs/vm-module-types'

export const emptyAddresses = (): Record<NetworkVMType, string> => ({
  [NetworkVMType.AVM]: '',
  [NetworkVMType.BITCOIN]: '',
  [NetworkVMType.CoreEth]: '',
  [NetworkVMType.EVM]: '',
  [NetworkVMType.HVM]: '',
  [NetworkVMType.HYPERCORE]: '',
  [NetworkVMType.PVM]: '',
  [NetworkVMType.SVM]: ''
})

export const findPublicKey =
  (path: string, curve: Curve) => (pk: AddressPublicKey) =>
    pk.derivationPath === path && pk.curve === curve

export enum Curve {
  SECP256K1 = 'secp256k1', // for EVM, AVM and Bitcoin
  ED25519 = 'ed25519' // for SVM and HVM
}
export const EVM_BASE_DERIVATION_PATH_PREFIX = "m/44'/60'/"
export const SVM_BASE_DERIVATION_PATH_PREFIX = "m/44'/501'/"

export const AVALANCHE_DERIVATION_PATH_PREFIX = "m/44'/9000'/"

export type AddressPublicKey = {
  curve: Curve
  derivationPath: string
  key: string
}

export type SeedlessPublicKeys = {
  publicKeys: AddressPublicKey[]
}

export const isEvmPublicKey = (publicKey: AddressPublicKey): boolean =>
  publicKey.derivationPath.startsWith(EVM_BASE_DERIVATION_PATH_PREFIX)

/**
 * Distinct account indices that have an EVM key, in stored order. Seedless
 * storage can hold index gaps (e.g. {0, 2}), so callers that need "which
 * accounts exist" must use this rather than the EVM key count.
 */
export const getEvmAccountIndices = (pubKeys: AddressPublicKey[]): number[] => {
  const indices = new Set<number>()
  for (const pubKey of pubKeys) {
    if (!isEvmPublicKey(pubKey)) continue
    // BIP44 EVM path m/44'/60'/0'/0/{accountIndex}
    const accountIndex = Number(pubKey.derivationPath.split('/').pop())
    if (Number.isInteger(accountIndex)) {
      indices.add(accountIndex)
    }
  }
  return Array.from(indices)
}

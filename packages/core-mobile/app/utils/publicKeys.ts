import { NetworkVMType } from '@avalabs/vm-module-types'

export const emptyAddresses = (): Record<NetworkVMType, string> => ({
  [NetworkVMType.AVM]: '',
  [NetworkVMType.BITCOIN]: '',
  [NetworkVMType.CoreEth]: '',
  [NetworkVMType.EVM]: '',
  [NetworkVMType.HVM]: '',
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

// Deprecated Avalanche public key path prefix
export const DEPRECATED_AVALANCHE_DERIVATION_PATH_PREFIX = "m/44'/9000'/0'/"

export const AVALANCHE_DERIVATION_PATH_PREFIX = "m/44'/9000'/"

export const getAvalancheExtendedKeyPath = (accountIndex: number): string =>
  `${AVALANCHE_DERIVATION_PATH_PREFIX}${accountIndex}'`

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

export const getXPAddressIndexFromDerivationPath = (path: string): number => {
  const unprefixed = path.replace('m/', '')
  const [, , , , addressIndex] = unprefixed.split('/')

  if (!addressIndex) {
    throw new Error('Invalid legacy X/P derivation path:' + path)
  }

  return parseInt(addressIndex)
}

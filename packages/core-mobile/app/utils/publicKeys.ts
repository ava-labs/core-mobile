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

export type AddressPublicKey = {
  curve: Curve
  derivationPath: string
  key: string
}

export type SeedlessPublicKeys = {
  publicKeys: AddressPublicKey[]
}

export type PickKeys<T, K extends (keyof T)[]> = Omit<T, K[number]>

export const isEvmPublicKey = (publicKey: AddressPublicKey): boolean =>
  publicKey.derivationPath.startsWith(EVM_BASE_DERIVATION_PATH_PREFIX)

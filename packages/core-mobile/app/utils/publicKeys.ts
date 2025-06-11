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

export type Curve = 'secp256k1' | 'ed25519'
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

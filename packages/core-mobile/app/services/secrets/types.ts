import { DerivationPath } from '@avalabs/core-wallets-sdk'
import { NetworkVMType } from '@avalabs/vm-module-types'

export enum SecretType {
  Mnemonic = 'mnemonic',
  Seedless = 'seedless'
}

export type Secp256k1 = 'secp256k1'
export type Ed25519 = 'ed25519'
export type Curve = Secp256k1 | Ed25519
export const EVM_BASE_DERIVATION_PATH_PREFIX = "m/44'/60'/"
export const EVM_BASE_DERIVATION_PATH = "m/44'/60'/0'"
export const AVALANCHE_BASE_DERIVATION_PATH = "m/44'/9000'/0'"

export type AddressPublicKeyJson<HasDerivationPath extends boolean = true> = {
  type: 'address-pubkey'
  curve: Curve
  derivationPath: HasDerivationPath extends true ? string : null
  key: string
}

export type ExtendedPublicKey = {
  type: 'extended-pubkey'
  curve: Secp256k1
  derivationPath: string
  key: string
}

interface SecretsBase {
  secretType: SecretType
}

interface PrimarySecretsBase extends SecretsBase {
  id: string
  publicKeys: AddressPublicKeyJson[]
}

export interface SeedlessSecrets extends PrimarySecretsBase {
  secretType: SecretType.Seedless
  derivationPathSpec: DerivationPath.BIP44
}

export interface MnemonicSecrets extends PrimarySecretsBase {
  secretType: SecretType.Mnemonic
  mnemonic: string
  extendedPublicKeys: ExtendedPublicKey[]
  derivationPathSpec: DerivationPath.BIP44
}

export type PrimaryWalletSecrets = MnemonicSecrets | SeedlessSecrets

export type DerivationPathsMapKey = Exclude<
  NetworkVMType,
  NetworkVMType.PVM | NetworkVMType.CoreEth
>

export type DerivationPathsMap = Record<DerivationPathsMapKey, string>

export enum SecretsError {
  SecretsNotFound = 'secrets-not-found',
  UnsupportedSecretType = 'unsupported-secret-type',
  MissingExtendedPublicKey = 'missing-ext-pubkey',
  WalletAlreadyExists = 'wallet-already-exists',
  PublicKeyNotFound = 'public-key-not-found',
  NoAccountIndex = 'no-account-index',
  DerivationPathMissing = 'derivation-path-missing',
  UnknownDerivationPathFormat = 'unknown-derivation-path-format',
  DerivationPathTooShort = 'derivation-path-too-short',
  UnsupportedCurve = 'unsupported-curve'
}

export type WalletSecretInStorage = {
  wallets: PrimaryWalletSecrets[]
}

export type PickKeys<T, K extends (keyof T)[]> = Omit<T, K[number]>

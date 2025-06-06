import { NetworkVMType } from '@avalabs/vm-module-types'
import { ethErrors } from 'eth-rpc-errors'

import {
  AddressPublicKeyJson,
  Curve,
  DerivationPathsMap,
  ExtendedPublicKey,
  PrimaryWalletSecrets,
  SecretsError
} from './types'

export const emptyAddresses = (): Record<NetworkVMType, string> => ({
  [NetworkVMType.AVM]: '',
  [NetworkVMType.BITCOIN]: '',
  [NetworkVMType.CoreEth]: '',
  [NetworkVMType.EVM]: '',
  [NetworkVMType.HVM]: '',
  [NetworkVMType.PVM]: '',
  [NetworkVMType.SVM]: ''
})

export const emptyDerivationPaths = (): DerivationPathsMap => ({
  [NetworkVMType.AVM]: '',
  [NetworkVMType.BITCOIN]: '',
  [NetworkVMType.EVM]: '',
  [NetworkVMType.HVM]: '',
  [NetworkVMType.SVM]: ''
})

export function assertDerivationPath(path?: string): asserts path is string {
  if (typeof path !== 'string') {
    throw ethErrors.rpc.internal({
      data: {
        reason: SecretsError.DerivationPathMissing,
        context: `Expected a string. Received: ${path}`
      }
    })
  }

  if (!path.startsWith(`m/44'`)) {
    throw ethErrors.rpc.internal({
      data: {
        reason: SecretsError.UnknownDerivationPathFormat,
        context: `Only BIP-44 compliant paths are supported. Received: ${path}`
      }
    })
  }

  const levels = path.split('/').length - 1 // BIP-44 does not count the `m/` prefix as a path "level".

  if (levels < 4) {
    throw ethErrors.rpc.internal({
      data: {
        reason: SecretsError.DerivationPathTooShort,
        context: `At least 4 derivation path levels need to be provided. Received: ${levels} in "${path}"`
      }
    })
  }
}

export function buildExtendedPublicKey(
  key: string,
  derivationPath: string
): ExtendedPublicKey {
  return {
    type: 'extended-pubkey',
    curve: 'secp256k1',
    derivationPath,
    key
  }
}

const findPublicKey =
  (path: string, curve: Curve) => (pk: AddressPublicKeyJson) =>
    pk.derivationPath === path && pk.curve === curve

const findExtendedPublicKey =
  (path: string, curve: Curve, exact = false) =>
  (extPk: ExtendedPublicKey) => {
    if (exact) {
      return extPk.derivationPath === path && extPk.curve === curve
    }
    return path.startsWith(`${extPk.derivationPath}/`) && extPk.curve === curve
  }

export function hasPublicKeyFor(
  secrets: PrimaryWalletSecrets,
  path: string,
  curve: Curve
): boolean {
  return secrets.publicKeys.some(findPublicKey(path, curve))
}

export function getPublicKeyFor(
  secrets: PrimaryWalletSecrets,
  path: string,
  curve: Curve
): AddressPublicKeyJson | undefined {
  return secrets.publicKeys.find(findPublicKey(path, curve))
}

export function hasExtendedPublicKeyFor(
  keys: ExtendedPublicKey[],
  path: string,
  curve: Curve
): boolean {
  return keys.some(findExtendedPublicKey(path, curve))
}

export function getExtendedPublicKeyFor(
  keys: ExtendedPublicKey[],
  path: string,
  curve: Curve
): ExtendedPublicKey | undefined {
  return keys.find(findExtendedPublicKey(path, curve))
}

export function getExtendedPublicKey(
  keys: ExtendedPublicKey[],
  path: string,
  curve: Curve
): ExtendedPublicKey | undefined {
  return keys.find(findExtendedPublicKey(path, curve, true))
}

import * as cs from '@cubist-labs/cubesigner-sdk'
import { strip0x } from '@avalabs/core-utils-sdk'
import { AddressPublicKey, Curve } from 'utils/publicKeys'

type AccountKeySet = {
  evm?: cs.KeyInfo
  solana?: cs.KeyInfo
  ava: cs.KeyInfo[]
}

const createAccountKeySet = (): AccountKeySet => ({
  ava: []
})

export const transformKeyInfosToPubKeys = (
  keyInfos: cs.KeyInfo[]
  // eslint-disable-next-line sonarjs/cognitive-complexity
): AddressPublicKey[] => {
  const requiredKeyTypes: cs.KeyTypeApi[] = [cs.Secp256k1.Evm, cs.Secp256k1.Ava]
  const optionalKeyTypes: cs.KeyTypeApi[] = [cs.Ed25519.Solana]
  const allowedKeyTypes = [...requiredKeyTypes, ...optionalKeyTypes]

  const keys = keyInfos
    ?.filter(
      k =>
        k.enabled &&
        allowedKeyTypes.includes(k.key_type) &&
        k.derivation_info?.derivation_path
    )
    .reduce((acc, key) => {
      if (!key.derivation_info) {
        return acc
      }

      const index =
        key.key_type === cs.Ed25519.Solana
          ? parseInt(
              key.derivation_info.derivation_path.split('/').at(-2) as string
            )
          : Number(key.derivation_info.derivation_path.split('/').pop())
      if (index === undefined) {
        return acc
      }

      const mnemonicId = key.derivation_info.mnemonic_id
      acc[mnemonicId] = [...(acc[mnemonicId] ?? [])]
      const mnemonicBlock = acc[mnemonicId]

      mnemonicBlock[index] = mnemonicBlock[index] ?? createAccountKeySet()
      const accountKeySet = mnemonicBlock[index]

      switch (key.key_type) {
        case cs.Secp256k1.Evm:
          accountKeySet.evm = key
          break
        case cs.Secp256k1.Ava:
          accountKeySet.ava = [...accountKeySet.ava, key]
          break
        case cs.Ed25519.Solana:
          accountKeySet.solana = key
          break
        default:
          break
      }

      return acc
    }, {} as Record<string, AccountKeySet[]>)

  if (!keys || Object.keys(keys).length === 0) {
    throw new Error('Accounts not created')
  }

  const allDerivedKeySets = Object.values(keys)

  // We only look for key sets that contain all of the required key types.
  const validKeySets = allDerivedKeySets.filter(keySet => {
    return keySet
      .filter(key => Boolean(key))
      .every(key => key?.evm && key?.ava.length)
  })

  if (!validKeySets[0]) {
    throw new Error('Accounts keys missing')
  }

  // If there are multiple valid sets, we choose the first one.
  const derivedKeys = validKeySets[0]
  const pubkeys = [] as AddressPublicKey[]

  derivedKeys.forEach(key => {
    if (!key || !key.ava.length || !key.evm) {
      return
    }

    if (
      !key.evm.derivation_info?.derivation_path ||
      key.ava.some(avaKey => !avaKey.derivation_info?.derivation_path)
    ) {
      throw new Error('Derivation path not found')
    }

    pubkeys.push({
      curve: Curve.SECP256K1,
      derivationPath: key.evm.derivation_info.derivation_path,
      key: strip0x(key.evm.public_key)
    })

    key.ava.forEach(avaKey => {
      const derivationPath = avaKey.derivation_info?.derivation_path

      if (!derivationPath) {
        throw new Error('Derivation path not found')
      }

      pubkeys.push({
        curve: Curve.SECP256K1,
        derivationPath,
        key: strip0x(avaKey.public_key)
      })
    })

    if (key.solana?.derivation_info?.derivation_path) {
      pubkeys.push({
        curve: Curve.ED25519,
        derivationPath: key.solana.derivation_info.derivation_path,
        key: strip0x(key.solana.public_key)
      })
    }
  })

  if (!pubkeys?.length) {
    throw new Error('Address not found')
  }

  return pubkeys
}

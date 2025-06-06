import * as cs from '@cubist-labs/cubesigner-sdk'
import { strip0x } from '@avalabs/core-utils-sdk'
import { AddressPublicKeyJson } from 'services/secrets/types'

export const transformKeyInfosToPubKeys = async (
  keyInfos: cs.KeyInfo[]
  // eslint-disable-next-line sonarjs/cognitive-complexity
): Promise<Promise<AddressPublicKeyJson[]>> => {
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

      acc[key.derivation_info.mnemonic_id] = [
        ...(acc[key.derivation_info.mnemonic_id] ?? [])
      ]
      const mnemonicBlock = acc[key.derivation_info.mnemonic_id] || []

      mnemonicBlock[index] = {
        ...acc[key.derivation_info.mnemonic_id]?.[index],
        [key.key_type]: key
      }

      return acc
    }, {} as Record<string, Record<string, cs.KeyInfo>[]>)

  if (!keys || Object.keys(keys).length === 0) {
    throw new Error('Accounts not created')
  }

  const allDerivedKeySets = Object.values(keys)

  // We only look for key sets that contain all of the required key types.
  const validKeySets = allDerivedKeySets.filter(keySet => {
    return keySet.every(key => requiredKeyTypes.every(type => key[type]))
  })

  if (!validKeySets[0]) {
    throw new Error('Accounts keys missing')
  }

  // If there are multiple valid sets, we choose the first one.
  const derivedKeys = validKeySets[0]
  const pubkeys = [] as AddressPublicKeyJson[]

  derivedKeys.forEach(key => {
    if (!key || !key[cs.Secp256k1.Ava] || !key[cs.Secp256k1.Evm]) {
      return
    }

    if (
      !key[cs.Secp256k1.Evm].derivation_info?.derivation_path ||
      !key[cs.Secp256k1.Ava].derivation_info?.derivation_path
    ) {
      throw new Error('Derivation path not found')
    }

    pubkeys.push(
      {
        curve: 'secp256k1',
        derivationPath: key[cs.Secp256k1.Evm].derivation_info.derivation_path,
        key: strip0x(key[cs.Secp256k1.Evm].public_key),
        type: 'address-pubkey'
      },
      {
        curve: 'secp256k1',
        derivationPath: key[cs.Secp256k1.Ava].derivation_info.derivation_path,
        key: strip0x(key[cs.Secp256k1.Ava].public_key),
        type: 'address-pubkey'
      }
    )

    if (key[cs.Ed25519.Solana]?.derivation_info?.derivation_path) {
      pubkeys.push({
        curve: 'ed25519',
        derivationPath: key[cs.Ed25519.Solana].derivation_info.derivation_path,
        key: strip0x(key[cs.Ed25519.Solana].public_key),
        type: 'address-pubkey'
      })
    }
  })

  if (!pubkeys?.length) {
    throw new Error('Address not found')
  }

  return pubkeys
}

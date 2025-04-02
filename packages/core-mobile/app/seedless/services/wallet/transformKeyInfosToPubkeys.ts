import * as cs from '@cubist-labs/cubesigner-sdk'
import { strip0x } from '@avalabs/core-utils-sdk'
import { PubKeyType } from 'services/wallet/types'

export const transformKeyInfosToPubKeys = (
  keyInfos: cs.KeyInfo[]
): PubKeyType[] => {
  // get derived keys only and group them
  const requiredKeyTypes = [
    cs.Secp256k1.Evm.toString(),
    cs.Secp256k1.Ava.toString()
  ]
  const keys = keyInfos
    ?.filter(
      k =>
        k.enabled &&
        requiredKeyTypes.includes(k.key_type) &&
        Boolean(k.derivation_info?.derivation_path)
    )
    .reduce<Record<string, Record<string, cs.KeyInfo>[]>>((acc, key) => {
      const { derivation_info } = key

      if (
        !derivation_info ||
        derivation_info.derivation_path.split('/').pop() === undefined
      ) {
        return acc
      }

      const { mnemonic_id, derivation_path } = derivation_info
      const index = Number(derivation_path.split('/').pop())

      const mnemonicBlock = acc[mnemonic_id] || []

      mnemonicBlock[index] = {
        ...mnemonicBlock[index],
        [key.key_type]: key
      }

      acc[mnemonic_id] = mnemonicBlock

      return acc
    }, {})

  if (Object.keys(keys).length === 0) {
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
  const pubkeys: PubKeyType[] = []

  derivedKeys.forEach(key => {
    const AvaKey = key[cs.Secp256k1.Ava]
    const EvmKey = key[cs.Secp256k1.Evm]

    if (!AvaKey || !EvmKey) {
      return
    }

    pubkeys.push({
      evm: strip0x(EvmKey.public_key),
      xp: strip0x(AvaKey.public_key)
    })
  })

  if (pubkeys.length === 0) {
    throw new Error('Address not found')
  }

  return pubkeys
}

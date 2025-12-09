import * as cs from '@cubist-labs/cubesigner-sdk'
import { strip0x } from '@avalabs/core-utils-sdk'
import { AddressPublicKey, Curve } from 'utils/publicKeys'
import { toSegments } from 'utils/toSegments'

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
  // Also include testnet Avalanche addresses
  const testnetKeyTypes: cs.KeyTypeApi[] = ['SecpAvaTestAddr' as cs.KeyTypeApi]
  const allowedKeyTypes = [
    ...requiredKeyTypes,
    ...optionalKeyTypes,
    ...testnetKeyTypes
  ]

  /**
   *
   * Step 1:filter out keys that
   *  1. are not enabled
   *  2. are not in the allowed key types (EVM, AVM, Solana)
   *  3. do not have a derivation path
   */
  const filteredKeys = keyInfos?.filter(
    k =>
      k.enabled &&
      allowedKeyTypes.includes(k.key_type) &&
      k.derivation_info?.derivation_path
  )

  /**
   * Step 2: parse the derivation path to get the account index
   * Solana: get second-to-last segment
   * EVM/Avalanche: detect derivation spec
   *   - New spec: m/44'/coin'/account'/0/0 (account index in 3rd position)
   *   - Old spec: m/44'/coin'/0'/0/addressIndex (addressIndex in last position)
   *   - If last segment is 0 and account segment is greater than 0, use account index
   *   - Otherwise, use account 0
   */
  const keys = filteredKeys.reduce((acc, key) => {
    if (!key.derivation_info) {
      return acc
    }

    let index: number
    if (key.key_type === cs.Ed25519.Solana) {
      // Solana: get second-to-last segment as the path is missing the address index when we receive it 
      index = parseInt(
        key.derivation_info.derivation_path.split('/').at(-2) as string
      )
    } else if ([cs.Secp256k1.Ava, 'SecpAvaTestAddr'].includes(key.key_type)) {
      // For Avalanche keys, detect derivation spec

      const { accountIndex, addressIndex } = toSegments(
        key.derivation_info.derivation_path
      )

      // New spec: m/44'/coin'/account'/0/0 (account index in 3rd position)
      // Old spec: m/44'/coin'/0'/0/addressIndex (addressIndex in last position)
      if (addressIndex === 0 && accountIndex > 0) {
        // New derivation spec - use account index
        index = accountIndex
      } else {
        // Old derivation spec - map addressIndex to account 0
        // All old addresses belong to account 0
        index = 0
      }
    } else {
      const { addressIndex } = toSegments(key.derivation_info.derivation_path)
      // pop addresses index and return as number
      index = addressIndex
    }

    if (index === undefined) {
      return acc
    }

    // Step 3: group the keys by mnemonic id
    const mnemonicId = key.derivation_info.mnemonic_id
    acc[mnemonicId] = [...(acc[mnemonicId] ?? [])]
    const mnemonicBlock = acc[mnemonicId]

    mnemonicBlock[index] = mnemonicBlock[index] ?? createAccountKeySet()
    const accountKeySet = mnemonicBlock[index]

    if (!accountKeySet) {
      return acc
    }

    switch (key.key_type) {
      case cs.Secp256k1.Evm:
        accountKeySet.evm = key
        break
      case cs.Secp256k1.Ava:
      case 'SecpAvaTestAddr': // Handle testnet Avalanche addresses
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

  /**
   * Step 4: Validate key sets
   * - only keep mnemonic groups where EVERY account has both EVM and Avalanche keys
   */
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

  /**
   * Step 5: Convert key sets to public keys
   * - for each key set, create a public key object
   * - for each Avalanche key, create a public key object
   * - for each Solana key, create a public key object
   * - return the public key objects
   */
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

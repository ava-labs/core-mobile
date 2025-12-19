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
  console.log(
    '[transformKeyInfosToPubKeys] Starting',
    JSON.stringify(
      {
        totalKeyInfos: keyInfos?.length || 0,
        keyTypes: keyInfos?.map(k => k.key_type)
      },
      null,
      2
    )
  )

  console.log('keyInfos', JSON.stringify(keyInfos, null, 2))

  const requiredKeyTypes: cs.KeyTypeApi[] = [cs.Secp256k1.Evm]
  const optionalKeyTypes: cs.KeyTypeApi[] = [
    cs.Ed25519.Solana,
    cs.Secp256k1.Ava
  ]
  // Also include testnet Avalanche addresses
  const testnetKeyTypes: cs.KeyTypeApi[] = ['SecpAvaTestAddr' as cs.KeyTypeApi]
  const allowedKeyTypes = [
    ...requiredKeyTypes,
    ...optionalKeyTypes,
    ...testnetKeyTypes
  ]

  /**
   * Step 1: Filter out keys that
   *  1. are not enabled
   *  2. are not in the allowed key types (EVM, AVM, Solana)
   *  3. do not have a derivation path
   *
   * NOTE: We handle both old and new derivation path specs simultaneously:
   * - Old spec: m/44'/coin'/0'/0/addressIndex (all AVA keys map to account 0)
   * - New spec: m/44'/coin'/account'/0/0 (AVA keys use account index)
   * No filtering is done here - both specs are processed together
   */
  const filteredKeys = keyInfos?.filter(
    k =>
      k.enabled &&
      allowedKeyTypes.includes(k.key_type) &&
      k.derivation_info?.derivation_path
  )

  console.log(
    '[transformKeyInfosToPubKeys] After filtering',
    JSON.stringify(
      {
        filteredKeysCount: filteredKeys?.length || 0,
        filteredKeyTypes: filteredKeys?.map(k => k.key_type),
        filteredDerivationPaths: filteredKeys?.map(
          k => k.derivation_info?.derivation_path
        )
      },
      null,
      2
    )
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

  console.log(
    '[transformKeyInfosToPubKeys] After reduce',
    JSON.stringify(
      {
        mnemonicIds: Object.keys(keys),
        accountsPerMnemonic: Object.entries(keys).map(
          ([mnemonicId, accounts]) => ({
            mnemonicId,
            accountCount: accounts.filter(Boolean).length,
            accounts: accounts
              .map((acc, idx) =>
                acc
                  ? {
                      index: idx,
                      hasEVM: !!acc.evm,
                      hasAVA: acc.ava.length > 0,
                      avaCount: acc.ava.length,
                      hasSolana: !!acc.solana
                    }
                  : null
              )
              .filter(Boolean)
          })
        )
      },
      null,
      2
    )
  )

  if (!keys || Object.keys(keys).length === 0) {
    console.log(
      '[transformKeyInfosToPubKeys] Reduce returned empty object',
      JSON.stringify(
        {
          filteredKeysCount: filteredKeys?.length || 0
        },
        null,
        2
      )
    )
    throw new Error('Accounts not created')
  }

  const allDerivedKeySets = Object.values(keys)

  /**
   * Step 4: Validate key sets and filter to accounts with EVM keys
   * - Handle both old and new derivation path specs simultaneously:
   *   * Old spec AVA keys all map to account 0, so only account 0 will have AVA keys
   *   * New spec AVA keys map to their account index
   * - Return accounts that have EVM keys (with or without AVA keys)
   * - This allows accounts without AVA keys to be included so deriveMissingKeys can add them
   * - Accounts with both EVM and AVA keys are fully functional
   * - Accounts with only EVM keys will get AVA keys when deriveMissingKeys is called
   */
  const validKeySets = allDerivedKeySets.map(keySet => {
    // Filter to accounts that have EVM keys (with or without AVA keys)
    return keySet.filter(key => Boolean(key) && key?.evm)
  })

  // Find the first keySet that has at least one account with EVM keys
  const validKeySet = validKeySets.find(keySet => keySet.length > 0)

  console.log(
    '[transformKeyInfosToPubKeys] After validation',
    JSON.stringify(
      {
        validKeySetsCount: validKeySets.filter(ks => ks.length > 0).length,
        validKeySetLength: validKeySet?.length || 0,
        validAccounts: validKeySet?.map((acc, idx) => ({
          index: idx,
          hasEVM: !!acc.evm,
          hasAVA: acc.ava.length > 0,
          evmPath: acc.evm?.derivation_info?.derivation_path,
          avaPaths: acc.ava.map(a => a.derivation_info?.derivation_path)
        }))
      },
      null,
      2
    )
  )

  if (!validKeySet || validKeySet.length === 0) {
    console.log(
      '[transformKeyInfosToPubKeys] No valid key set found',
      JSON.stringify(
        {
          allDerivedKeySetsCount: allDerivedKeySets.length,
          validKeySetsDetails: validKeySets.map((ks, idx) => ({
            keySetIndex: idx,
            length: ks.length,
            accounts: ks
              .map((acc, accIdx) =>
                acc
                  ? {
                      accountIndex: accIdx,
                      hasEVM: !!acc.evm,
                      hasAVA: acc.ava.length > 0
                    }
                  : null
              )
              .filter(Boolean)
          }))
        },
        null,
        2
      )
    )
    throw new Error('Accounts keys missing')
  }

  // Use accounts that have EVM keys (they may or may not have AVA keys yet)
  const derivedKeys = validKeySet
  const pubkeys = [] as AddressPublicKey[]

  /**
   * Step 5: Convert key sets to public keys
   * - for each key set, create a public key object
   * - for each Avalanche key, create a public key object
   * - for each Solana key, create a public key object
   * - return the public key objects
   */
  derivedKeys.forEach(key => {
    if (!key || !key.evm) {
      return
    }

    // Always include EVM key
    if (!key.evm.derivation_info?.derivation_path) {
      throw new Error('Derivation path not found')
    }

    pubkeys.push({
      curve: Curve.SECP256K1,
      derivationPath: key.evm.derivation_info.derivation_path,
      key: strip0x(key.evm.public_key)
    })

    // Only include AVA keys if they exist (may be empty if deriveMissingKeys hasn't been called yet)
    if (!key.ava.length) {
      return
    }

    // Validate AVA keys have derivation paths
    if (key.ava.some(avaKey => !avaKey.derivation_info?.derivation_path)) {
      throw new Error('Derivation path not found')
    }

    // Include AVA keys
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

  console.log(
    '[transformKeyInfosToPubKeys] Final pubkeys',
    JSON.stringify(
      {
        pubkeysCount: pubkeys.length,
        pubkeys: pubkeys.map(pk => ({
          derivationPath: pk.derivationPath,
          curve: pk.curve
        }))
      },
      null,
      2
    )
  )

  if (!pubkeys?.length) {
    console.log('[transformKeyInfosToPubKeys] No pubkeys generated')
    throw new Error('Address not found')
  }

  console.log('[transformKeyInfosToPubKeys] Completed successfully')
  return pubkeys
}

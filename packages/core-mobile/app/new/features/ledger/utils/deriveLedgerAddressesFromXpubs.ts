/**
 * Batch-derive Ledger addresses (mainnet + testnet) from BIP44 xpubs in
 * parallel via @avalabs/crypto-sdk's native derivation. Returns null and
 * logs on failure (all-or-nothing per batch).
 *
 * DerivedSecp256k1Addresses is a structural superset of the local
 * DerivedAddresses type, so callers can use returned items directly
 * anywhere DerivedAddresses is expected.
 */
import {
  deriveAddressesFromXpubs,
  type DerivedSecp256k1Addresses
} from '@avalabs/crypto-sdk'
import Logger from 'utils/Logger'

export interface LedgerXpubAddressBatch {
  mainnet: DerivedSecp256k1Addresses[]
  testnet: DerivedSecp256k1Addresses[]
}

export async function deriveLedgerAddressesFromXpubs(
  evmXpub: string,
  avalancheXpubs: readonly string[],
  accountIndices: readonly number[]
): Promise<LedgerXpubAddressBatch | null> {
  try {
    const [mainnet, testnet] = await Promise.all([
      deriveAddressesFromXpubs(evmXpub, avalancheXpubs, false, accountIndices),
      deriveAddressesFromXpubs(evmXpub, avalancheXpubs, true, accountIndices)
    ])
    return { mainnet, testnet }
  } catch (error) {
    Logger.error('Failed to batch-derive Ledger addresses from xpubs', error)
    return null
  }
}

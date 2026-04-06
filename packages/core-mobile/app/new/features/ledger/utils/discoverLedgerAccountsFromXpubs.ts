/**
 * Background Ledger account discovery from stored xpubs.
 *
 * After a Ledger wallet is imported with account 0, this module:
 * 1. Loads xpubs from the wallet secret (stored during import)
 * 2. Derives addresses offline for each xpub index
 * 3. Checks on-chain activity via the Balance API
 * 4. Returns the active account data ready for Redux dispatch
 */
import { Account, AccountCollection } from 'store/account'
import { CoreAccountType } from '@avalabs/types'
import { uuid } from 'utils/uuid'
import Logger from 'utils/Logger'
import BiometricsSDK from 'utils/BiometricsSDK'
import { LedgerWalletSecretSchema } from '../utils'
import {
  deriveAddressesFromXpub,
  DerivedAddresses
} from 'services/ledger/deriveAddressesOffline'
import {
  getActiveAccountIndices,
  LedgerDerivedAccount
} from './discoverLedgerAccounts'

export interface DiscoveredLedgerAccount {
  account: Account
  mainnetAddresses: DerivedAddresses
  testnetAddresses: DerivedAddresses
}

/**
 * Discover active Ledger accounts from stored xpubs (BIP44 only).
 *
 * Loads the wallet secret, extracts xpubs for indices > 0, derives addresses
 * offline, checks activity, and returns Account objects ready for dispatch.
 */
export async function discoverLedgerAccountsFromXpubs(
  walletId: string
): Promise<DiscoveredLedgerAccount[]> {
  // Load and parse wallet secret
  const secretResult = await BiometricsSDK.loadWalletSecret(walletId)
  if (!secretResult.success || !secretResult.value) {
    Logger.error(
      'Failed to load wallet secret for Ledger account discovery'
    )
    return []
  }

  let parsedSecret
  try {
    parsedSecret = LedgerWalletSecretSchema.parse(
      JSON.parse(secretResult.value)
    )
  } catch (error) {
    Logger.error('Failed to parse Ledger wallet secret', error)
    return []
  }

  const xpubs = parsedSecret.extendedPublicKeys
  // Solana addresses stored during import (Ed25519, can't derive from xpubs)
  const solanaAddresses: Record<string, string> =
    (parsedSecret as Record<string, unknown>).solanaAddresses as Record<
      string,
      string
    > ?? {}

  Logger.info('Ledger discovery: wallet secret parsed', {
    hasXpubs: !!xpubs,
    xpubIndices: xpubs ? Object.keys(xpubs) : [],
    solanaIndices: Object.keys(solanaAddresses),
    derivationPathSpec: parsedSecret.derivationPathSpec
  })

  if (!xpubs) {
    Logger.info('No extended public keys stored — skipping Ledger discovery')
    return []
  }

  // Find xpub indices > 0 (account 0 is already created)
  const additionalIndices = Object.keys(xpubs)
    .map(Number)
    .filter(idx => idx > 0)
    .sort((a, b) => a - b)

  if (additionalIndices.length === 0) {
    Logger.info('No additional xpub indices found for discovery')
    return []
  }

  Logger.info(
    `Discovering Ledger accounts from ${additionalIndices.length} stored xpubs`
  )

  // For EVM, all accounts share the same account-level xpub at index 0.
  // Different accounts are at different address indices within that xpub.
  const evmAccountXpub = xpubs[0]?.evm
  if (!evmAccountXpub) {
    Logger.error('Missing EVM xpub at index 0 for Ledger discovery')
    return []
  }

  // Derive mainnet addresses offline for activity checking
  const derivedAccounts: LedgerDerivedAccount[] = []
  const addressesByIndex = new Map<
    number,
    { mainnet: DerivedAddresses; testnet: DerivedAddresses }
  >()

  for (const index of additionalIndices) {
    const accountXpubs = xpubs[index]
    if (!accountXpubs?.avalanche) continue

    try {
      // Use the shared EVM xpub from index 0, with this account's address index
      const mainnet = deriveAddressesFromXpub(
        evmAccountXpub,
        accountXpubs.avalanche,
        false,
        index // EVM address index within shared account xpub
      )
      const testnet = deriveAddressesFromXpub(
        evmAccountXpub,
        accountXpubs.avalanche,
        true,
        index
      )

      addressesByIndex.set(index, { mainnet, testnet })

      derivedAccounts.push({
        index,
        addressC: mainnet.evm,
        addressBTC: mainnet.btc,
        xpubXP: accountXpubs.avalanche,
        addressSVM: solanaAddresses[index] ?? undefined
      })
    } catch (error) {
      Logger.error(`Failed to derive addresses for index ${index}`, error)
    }
  }

  if (derivedAccounts.length === 0) {
    return []
  }

  // Check which indices have on-chain activity
  const activeIndices = await getActiveAccountIndices(derivedAccounts)

  // Filter to only indices > 0 that are active (index 0 is always in the result
  // from getActiveAccountIndices, but we skip it since account 0 already exists)
  const newActiveIndices = activeIndices.filter(idx => idx > 0)

  if (newActiveIndices.length === 0) {
    Logger.info('No additional active Ledger accounts found')
    return []
  }

  Logger.info(`Found ${newActiveIndices.length} active Ledger accounts`)

  // Build Account objects for each active index
  const discoveredAccounts: DiscoveredLedgerAccount[] = []

  for (const index of newActiveIndices) {
    const addresses = addressesByIndex.get(index)
    if (!addresses) continue

    const account: Account = {
      id: uuid(),
      walletId,
      name: `Account ${index + 1}`,
      type: CoreAccountType.PRIMARY,
      index,
      addressC: addresses.mainnet.evm,
      addressBTC: addresses.mainnet.btc,
      addressAVM: addresses.mainnet.avm,
      addressPVM: addresses.mainnet.pvm,
      addressSVM: '', // Solana handled separately if needed
      addressCoreEth: addresses.mainnet.coreEth
    }

    discoveredAccounts.push({
      account,
      mainnetAddresses: addresses.mainnet,
      testnetAddresses: addresses.testnet
    })
  }

  return discoveredAccounts
}

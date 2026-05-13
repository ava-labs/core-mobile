/**
 * Background Ledger account discovery from stored key material.
 *
 * After a Ledger wallet is imported with account 0, this module:
 * 1. Loads key material from the wallet secret (stored during import)
 *    - BIP44: xpubs at m/44'/60'/0' and m/44'/9000'/{i}'
 *    - LedgerLive: raw public keys at address level
 * 2. Derives addresses offline for each stored index
 * 3. Checks on-chain activity via the Balance API
 * 4. Returns the active account data ready for Redux dispatch
 */
import { Account } from 'store/account'
import { CoreAccountType } from '@avalabs/types'
import { uuid } from 'utils/uuid'
import Logger from 'utils/Logger'
import BiometricsSDK from 'utils/BiometricsSDK'
import { LedgerDerivationPathType } from 'services/ledger/types'
import {
  deriveAddressesBatch,
  deriveAddressesFromPublicKeys,
  DerivedAddresses
} from 'services/ledger/deriveAddressesOffline'
import { LedgerWalletSecretSchema } from '../utils'
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
 * Discover active Ledger accounts from stored key material.
 *
 * BIP44: derives addresses from xpubs (shared EVM xpub + per-account Avalanche xpub).
 * LedgerLive: derives addresses from raw public keys stored per-index.
 */
export async function discoverLedgerAccountsFromXpubs(
  walletId: string
): Promise<DiscoveredLedgerAccount[]> {
  // Load and parse wallet secret
  const secretResult = await BiometricsSDK.loadWalletSecret(walletId)
  if (!secretResult.success || !secretResult.value) {
    Logger.error('Failed to load wallet secret for Ledger account discovery')
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

  // Solana addresses stored during import (Ed25519, can't derive from xpubs)
  const solanaAddresses: Record<string, string> =
    ((parsedSecret as Record<string, unknown>).solanaAddresses as Record<
      string,
      string
    >) ?? {}

  const isLedgerLive =
    parsedSecret.derivationPathSpec === LedgerDerivationPathType.LedgerLive

  Logger.info('Ledger discovery: wallet secret parsed', {
    derivationPathSpec: parsedSecret.derivationPathSpec,
    hasXpubs: !!parsedSecret.extendedPublicKeys,
    xpubIndices: parsedSecret.extendedPublicKeys
      ? Object.keys(parsedSecret.extendedPublicKeys)
      : [],
    publicKeyIndices: Object.keys(parsedSecret.publicKeys),
    solanaIndices: Object.keys(solanaAddresses)
  })

  if (isLedgerLive) {
    return discoverFromPublicKeys(
      walletId,
      parsedSecret.publicKeys,
      solanaAddresses
    )
  }

  return discoverFromXpubs(
    walletId,
    parsedSecret.extendedPublicKeys,
    solanaAddresses
  )
}

/**
 * BIP44 discovery path: derive addresses from xpubs.
 */
async function discoverFromXpubs(
  walletId: string,
  xpubs: Record<number, { evm?: string; avalanche?: string }> | undefined,
  solanaAddresses: Record<string, string>
): Promise<DiscoveredLedgerAccount[]> {
  if (!xpubs) {
    Logger.info('No extended public keys stored — skipping BIP44 discovery')
    return []
  }

  const additionalIndices = Object.keys(xpubs)
    .map(Number)
    .filter(idx => idx > 0)
    .sort((a, b) => a - b)

  if (additionalIndices.length === 0) {
    Logger.info('No additional xpub indices found for discovery')
    return []
  }

  // For EVM, all accounts share the same account-level xpub at index 0.
  const evmAccountXpub = xpubs[0]?.evm
  if (!evmAccountXpub) {
    Logger.error('Missing EVM xpub at index 0 for Ledger discovery')
    return []
  }

  Logger.info(
    `Discovering Ledger accounts from ${additionalIndices.length} stored xpubs`
  )

  // Build aligned arrays: only include indices that have an Avalanche xpub.
  const validIndices: number[] = []
  const avalancheXpubsForBatch: string[] = []
  for (const index of additionalIndices) {
    const accountXpubs = xpubs[index]
    if (!accountXpubs?.avalanche) continue
    validIndices.push(index)
    avalancheXpubsForBatch.push(accountXpubs.avalanche)
  }

  const derivedAccounts: LedgerDerivedAccount[] = []
  const addressesByIndex = new Map<
    number,
    { mainnet: DerivedAddresses; testnet: DerivedAddresses }
  >()

  if (validIndices.length === 0) {
    return buildDiscoveredAccounts({
      walletId,
      derivedAccounts,
      addressesByIndex,
      solanaAddresses
    })
  }

  // Derive all accounts in a single native call per network.
  // avalancheXpubs is aligned 1-to-1 with validIndices.
  //
  // Use allSettled so a rejection from one network's batch (native + JS
  // fallback both failing, or an unanticipated synchronous throw inside
  // deriveAddressesBatch) doesn't silently zero out the entire discovery
  // result. The downstream loop requires BOTH mainnet and testnet maps to
  // emit an account, so a single-network rejection still produces no
  // accounts in practice — but each failure is logged independently, and
  // an unrelated bug surfacing in only one batch can't mask the other.
  try {
    const [mainnetSettled, testnetSettled] = await Promise.allSettled([
      deriveAddressesBatch(
        evmAccountXpub,
        avalancheXpubsForBatch,
        false,
        validIndices
      ),
      deriveAddressesBatch(
        evmAccountXpub,
        avalancheXpubsForBatch,
        true,
        validIndices
      )
    ])

    const mainnetBatch =
      mainnetSettled.status === 'fulfilled'
        ? mainnetSettled.value
        : new Map<number, DerivedAddresses>()
    const testnetBatch =
      testnetSettled.status === 'fulfilled'
        ? testnetSettled.value
        : new Map<number, DerivedAddresses>()

    if (mainnetSettled.status === 'rejected') {
      Logger.error(
        'Mainnet batch derivation failed for Ledger discovery',
        mainnetSettled.reason
      )
    }
    if (testnetSettled.status === 'rejected') {
      Logger.error(
        'Testnet batch derivation failed for Ledger discovery',
        testnetSettled.reason
      )
    }

    for (let i = 0; i < validIndices.length; i++) {
      const index = validIndices[i]!
      try {
        const mainnet = mainnetBatch.get(index)
        const testnet = testnetBatch.get(index)
        if (!mainnet || !testnet) continue

        addressesByIndex.set(index, { mainnet, testnet })

        derivedAccounts.push({
          index,
          addressC: mainnet.evm,
          addressBTC: mainnet.btc,
          xpubXP: avalancheXpubsForBatch[i]!,
          addressSVM: solanaAddresses[index] ?? undefined
        })
      } catch (error) {
        // Isolate per-index mapping failures so one bad index doesn't drop
        // the whole batch. The native batch call itself is robust; reaching
        // here means a synchronous bug in the mapping above.
        Logger.error(
          `Failed to map batch-derived Ledger addresses for index ${index}`,
          error
        )
      }
    }
  } catch (error) {
    // Backstop for any unexpected throw that isn't captured by allSettled
    // or the per-index try (e.g. iteration-body memory error). With the
    // changes above, the only realistic path to here is a bug, not a
    // network-specific failure.
    Logger.error('Unexpected failure in Ledger batch discovery', error)
  }

  return buildDiscoveredAccounts({
    walletId,
    derivedAccounts,
    addressesByIndex,
    solanaAddresses
  })
}

/**
 * LedgerLive discovery path: derive addresses from stored public keys.
 *
 * Public keys are identified by their derivation path:
 * - EVM: path contains "60'" (m/44'/60'/{i}'/0/0)
 * - Avalanche: path contains "9000'" (m/44'/9000'/{i}'/0/0)
 */
async function discoverFromPublicKeys(
  walletId: string,
  publicKeys: Record<number, Array<{ key: string; derivationPath: string }>>,
  solanaAddresses: Record<string, string>
): Promise<DiscoveredLedgerAccount[]> {
  const additionalIndices = Object.keys(publicKeys)
    .map(Number)
    .filter(idx => idx > 0)
    .sort((a, b) => a - b)

  if (additionalIndices.length === 0) {
    Logger.info(
      'No additional public key indices found for LedgerLive discovery'
    )
    return []
  }

  Logger.info(
    `Discovering LedgerLive accounts from ${additionalIndices.length} stored public keys`
  )

  const derivedAccounts: LedgerDerivedAccount[] = []
  const addressesByIndex = new Map<
    number,
    { mainnet: DerivedAddresses; testnet: DerivedAddresses }
  >()

  for (const index of additionalIndices) {
    const keys = publicKeys[index]
    if (!keys) continue

    const evmKey = keys.find(k => k.derivationPath.includes("60'"))
    const avalancheKey = keys.find(k => k.derivationPath.includes("9000'"))

    if (!evmKey || !avalancheKey) {
      Logger.error(
        `Missing EVM or Avalanche public key for LedgerLive index ${index}`
      )
      continue
    }

    try {
      const mainnet = deriveAddressesFromPublicKeys(
        evmKey.key,
        avalancheKey.key,
        false
      )
      const testnet = deriveAddressesFromPublicKeys(
        evmKey.key,
        avalancheKey.key,
        true
      )

      addressesByIndex.set(index, { mainnet, testnet })

      derivedAccounts.push({
        index,
        addressC: mainnet.evm,
        addressBTC: mainnet.btc,
        xpubXP: '', // LedgerLive has no xpubs
        addressSVM: solanaAddresses[index] ?? undefined
      })
    } catch (error) {
      Logger.error(
        `Failed to derive addresses for LedgerLive index ${index}`,
        error
      )
    }
  }

  return buildDiscoveredAccounts({
    walletId,
    derivedAccounts,
    addressesByIndex,
    solanaAddresses
  })
}

/**
 * Shared: check activity and build Account objects for active indices.
 */
async function buildDiscoveredAccounts({
  walletId,
  derivedAccounts,
  addressesByIndex,
  solanaAddresses
}: {
  walletId: string
  derivedAccounts: LedgerDerivedAccount[]
  addressesByIndex: Map<
    number,
    { mainnet: DerivedAddresses; testnet: DerivedAddresses }
  >
  solanaAddresses: Record<string, string>
}): Promise<DiscoveredLedgerAccount[]> {
  if (derivedAccounts.length === 0) {
    return []
  }

  const activeIndices = await getActiveAccountIndices(derivedAccounts)
  const newActiveIndices = activeIndices.filter(idx => idx > 0)

  if (newActiveIndices.length === 0) {
    Logger.info('No additional active Ledger accounts found')
    return []
  }

  Logger.info(`Found ${newActiveIndices.length} active Ledger accounts`)

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
      addressSVM: solanaAddresses[index] ?? undefined,
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

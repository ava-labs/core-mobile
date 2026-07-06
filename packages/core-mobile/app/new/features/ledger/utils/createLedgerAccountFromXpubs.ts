/**
 * Create a Ledger account offline from stored xpubs (BIP44 only).
 *
 * When a BIP44 Ledger wallet has xpubs stored for a given account index,
 * we can derive all addresses offline without connecting to the device.
 * This makes adding accounts within the first 10 nearly instant.
 */
import { CoreAccountType } from '@avalabs/types'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'
import { uuid } from 'utils/uuid'
import { LedgerDerivationPathType } from 'services/ledger/types'
import { DerivedAddresses } from 'services/ledger/deriveAddressesOffline'
import { Account } from 'store/account'
import { LedgerWalletSecretSchema } from '../utils'
import { deriveLedgerAddressesFromXpubs } from './deriveLedgerAddressesFromXpubs'

export interface OfflineLedgerAccountResult {
  account: Account
  mainnetAddresses: DerivedAddresses
  testnetAddresses: DerivedAddresses
}

/**
 * Attempt to create a Ledger account offline from stored xpubs.
 *
 * Returns null if:
 * - The wallet secret can't be loaded or parsed
 * - The wallet isn't BIP44
 * - No xpubs are stored for the requested index
 * - The EVM xpub at index 0 is missing
 */
export async function createLedgerAccountFromXpubs(
  walletId: string,
  accountIndex: number
): Promise<OfflineLedgerAccountResult | null> {
  const secretResult = await BiometricsSDK.loadWalletSecret(walletId)
  if (!secretResult.success || !secretResult.value) {
    Logger.info('Cannot create offline account: wallet secret unavailable')
    return null
  }

  let parsedSecret
  try {
    parsedSecret = LedgerWalletSecretSchema.parse(
      JSON.parse(secretResult.value)
    )
  } catch {
    Logger.info('Cannot create offline account: failed to parse wallet secret')
    return null
  }

  // Only BIP44 wallets have xpubs that support offline derivation
  if (parsedSecret.derivationPathSpec !== LedgerDerivationPathType.BIP44) {
    return null
  }

  const xpubs = parsedSecret.extendedPublicKeys
  if (!xpubs) {
    return null
  }

  // Need the shared EVM xpub from index 0 and the Avalanche xpub for this index
  const evmAccountXpub = xpubs[0]?.evm
  const accountXpubs = xpubs[accountIndex]

  if (!evmAccountXpub || !accountXpubs?.avalanche) {
    Logger.info(
      `Cannot create offline account: missing xpubs for index ${accountIndex}`
    )
    return null
  }

  const batch = await deriveLedgerAddressesFromXpubs(
    evmAccountXpub,
    [accountXpubs.avalanche],
    [accountIndex]
  )
  if (!batch) return null

  const mainnetAddresses: DerivedAddresses | undefined = batch.mainnet[0]
  const testnetAddresses: DerivedAddresses | undefined = batch.testnet[0]
  if (!mainnetAddresses || !testnetAddresses) {
    Logger.info(
      `Offline derivation returned no result for index ${accountIndex}`
    )
    return null
  }

  // Check for stored Solana address
  const solanaAddresses: Record<string, string> =
    ((parsedSecret as Record<string, unknown>).solanaAddresses as Record<
      string,
      string
    >) ?? {}

  const account: Account = {
    id: uuid(),
    walletId,
    name: `Account ${accountIndex + 1}`,
    type: CoreAccountType.PRIMARY,
    index: accountIndex,
    addressC: mainnetAddresses.evm,
    addressBTC: mainnetAddresses.btc,
    addressAVM: mainnetAddresses.avm,
    addressPVM: mainnetAddresses.pvm,
    addressSVM: solanaAddresses[accountIndex] ?? undefined,
    addressCoreEth: mainnetAddresses.coreEth
  }

  return { account, mainnetAddresses, testnetAddresses }
}

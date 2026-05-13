import { AVM, EVM, PVM, VM } from '@avalabs/avalanchejs'
import { Account, AccountCollection } from 'store/account/types'
import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import WalletFactory from 'services/wallet/WalletFactory'
import { WalletType } from 'services/wallet/types'
import SeedlessWallet from 'seedless/services/wallet/SeedlessWallet'
import { transactionSnackbar } from 'common/utils/toast'
import Logger from 'utils/Logger'
import AccountsService from 'services/account/AccountsService'
import { AppListenerEffectAPI } from 'store/types'
import { recentAccountsStore } from 'features/accountSettings/store'
import { uuid } from 'utils/uuid'
import { Wallet } from 'store/wallet/types'
import {
  appendToStoredArray,
  commonStorage,
  CommonStorageKeys,
  loadArrayFromStorage
} from 'utils/mmkv'
import { setIsMigratingActiveAccounts } from 'store/wallet/slice'
import { selectWalletState, WalletState } from 'store/app'
import { setAccounts, setNonActiveAccounts } from './slice'

// Chunk size for incremental setNonActiveAccounts dispatches during
// mnemonic/keystone discovery. Balances UI responsiveness (users see accounts
// appear as they're derived) against the Redux re-render cost of each
// dispatch — chosen empirically while fixing CP-14062's re-render cascade.
const DISPATCH_BATCH_SIZE = 5

export function getAddressByVM(
  vm: VM,
  account: Account | undefined
): string | undefined {
  if (!account) {
    return
  }

  switch (vm) {
    case AVM:
      return account.addressAVM
    case PVM:
      return account.addressPVM
    case EVM:
      return account.addressCoreEth
  }
}

export function stripChainAddress(address: string): string {
  if (
    address.toLowerCase().startsWith('p-') ||
    address.toLowerCase().startsWith('c-') ||
    address.toLowerCase().startsWith('x-')
  )
    return address.slice(2)
  return address
}

export function getAddressByNetwork(
  account: Account,
  network: Network
): string | undefined {
  switch (network.vmName) {
    case NetworkVMType.EVM:
      return account.addressC
    case NetworkVMType.BITCOIN:
      return account.addressBTC
    case NetworkVMType.AVM:
      return account.addressAVM
    case NetworkVMType.PVM:
      return account.addressPVM
    case NetworkVMType.CoreEth:
      return account.addressCoreEth
    case NetworkVMType.SVM:
      return account.addressSVM
    default:
      throw new Error('unsupported network ' + network.vmName)
  }
}

export const deriveMissingSeedlessSessionKeys = async (
  walletId: string
): Promise<void> => {
  const wallet = await WalletFactory.createWallet({
    walletId,
    walletType: WalletType.SEEDLESS
  })
  if (wallet instanceof SeedlessWallet) {
    try {
      transactionSnackbar.pending({ message: 'Updating accounts...' })

      // prompt Core Seedless API to derive missing keys
      await wallet.deriveMissingKeys()

      transactionSnackbar.success({ message: 'Accounts updated' })
    } catch (error) {
      Logger.error('Failed to derive missing keys', error)
      transactionSnackbar.error({
        message: 'Failed to update accounts',
        error:
          error instanceof Error
            ? error.message
            : typeof error === 'string'
            ? error
            : undefined
      })
    }
  }
}

export const discoverRemainingActiveAccounts = async ({
  walletId,
  walletType,
  startIndex,
  onAccountCreated,
  scanWindow
}: {
  walletId: string
  walletType: WalletType
  startIndex: number
  onAccountCreated?: (account: Account) => void
  scanWindow?: number
}): Promise<{ accounts: AccountCollection; accountIds: string[] }> => {
  const toastId = uuid()
  const shouldShowToast = walletType !== WalletType.SEEDLESS

  if (shouldShowToast) {
    transactionSnackbar.pending({ message: 'Adding accounts...', toastId })
  }

  try {
    const { accounts, completedCleanly } =
      await AccountsService.fetchRemainingActiveAccounts({
        walletId,
        walletType,
        startIndex,
        onAccountCreated,
        scanWindow
      })

    const accountIds = Object.keys(accounts)

    if (shouldShowToast && accountIds.length > 0) {
      transactionSnackbar.success({
        message: `${accountIds.length} ${
          accountIds.length > 1 ? 'accounts' : 'account'
        } successfully added`,
        toastId
      })
    } else if (shouldShowToast) {
      transactionSnackbar.plain({
        message: 'No additional accounts found',
        toastId
      })
    }

    if (completedCleanly) {
      markWalletAsMigrated(walletId)
    }

    return { accounts, accountIds }
  } catch (error) {
    Logger.error('Failed to fetch remaining active accounts', error)
    transactionSnackbar.error({
      message: 'Failed to add accounts',
      error:
        error instanceof Error
          ? error.message
          : typeof error === 'string'
          ? error
          : undefined
    })
    return { accounts: {}, accountIds: [] }
  }
}

export const migrateRemainingActiveAccounts = async ({
  listenerApi,
  walletId,
  walletType,
  startIndex,
  scanWindow
}: {
  listenerApi: AppListenerEffectAPI
  walletId: string
  walletType: WalletType
  startIndex: number
  scanWindow?: number
}): Promise<void> => {
  const { getState, dispatch } = listenerApi
  dispatch(setIsMigratingActiveAccounts(true))

  try {
    // Early guard: skip discovery entirely if wallet is already inactive
    const initialWalletState = selectWalletState(getState())
    if (initialWalletState !== WalletState.ACTIVE) {
      Logger.error(
        'Wallet is not active, skipping migrateRemainingActiveAccounts'
      )
      global.toast?.hideAll()
      return
    }

    // Only MNEMONIC, KEYSTONE, and SEEDLESS reach this function — gated by
    // canMigrateActiveAccounts. Ledger wallets use a separate discovery path
    // (discoverLedgerAccountsFromXpubs).
    //
    // For seedless wallets, skip incremental dispatches entirely — XP balance
    // fetching iterates over all accounts, so batch flushes would trigger
    // redundant downstream work in balance/XP listeners. The final setAccounts
    // dispatch below covers seedless. For mnemonic/keystone, batch discovered
    // accounts and dispatch in DISPATCH_BATCH_SIZE-sized chunks to avoid a
    // re-render cascade from individual Redux dispatches (CP-14062).
    const isSeedless = walletType === WalletType.SEEDLESS
    let pendingAccounts: AccountCollection = {}
    let pendingAccountIds: string[] = []
    let walletBecameInactive = false

    const flushPendingAccounts = (): void => {
      if (pendingAccountIds.length === 0) return

      const currentWalletState = selectWalletState(getState())
      if (currentWalletState !== WalletState.ACTIVE) {
        Logger.error(
          'Wallet became inactive during discovery, discarding pending batch'
        )
        walletBecameInactive = true
        pendingAccounts = {}
        pendingAccountIds = []
        return
      }

      dispatch(setNonActiveAccounts(pendingAccounts))
      pendingAccounts = {}
      pendingAccountIds = []
    }

    const { accounts, accountIds } = await discoverRemainingActiveAccounts({
      walletId,
      walletType,
      startIndex,
      scanWindow,
      onAccountCreated: isSeedless
        ? undefined
        : account => {
            if (walletBecameInactive) return

            pendingAccounts[account.id] = account
            pendingAccountIds.push(account.id)

            if (pendingAccountIds.length >= DISPATCH_BATCH_SIZE) {
              flushPendingAccounts()
            }
          }
    })

    // Flush any remaining accounts that didn't fill a complete batch.
    // No-op for seedless (no callback was wired).
    flushPendingAccounts()

    const state = getState()
    const walletState = selectWalletState(state)
    if (walletState !== WalletState.ACTIVE) {
      Logger.error(
        'Wallet is not active, skipping migrateRemainingActiveAccounts'
      )
      global.toast?.hideAll()
      return
    }

    if (accountIds.length > 0) {
      // Final setAccounts dispatch ensures listeners that react specifically
      // to setAccounts (balance, WalletConnect) fire once with all accounts.
      dispatch(setAccounts(accounts))
      // addRecentAccounts is called here (not in the batch flushes) so that
      // all IDs are added exactly once — addRecentAccounts does not deduplicate.
      recentAccountsStore.getState().addRecentAccounts(accountIds)
    }
  } finally {
    dispatch(setIsMigratingActiveAccounts(false))
  }
}

export const shouldMigrateActiveAccounts = async ({
  wallet,
  numberOfAccounts
}: {
  wallet: Wallet
  numberOfAccounts: number
}): Promise<boolean> => {
  if (wallet.type === WalletType.SEEDLESS) {
    const numberOfActiveAccounts =
      await AccountsService.getSeedlessActiveAccountCount()

    return numberOfAccounts < numberOfActiveAccounts
  } else if (
    wallet.type === WalletType.MNEMONIC ||
    wallet.type === WalletType.KEYSTONE
  ) {
    return isWalletMigrated(wallet.id) === false
  }

  return false
}

export const canMigrateActiveAccounts = (
  wallet: Wallet
): wallet is Wallet & {
  type: WalletType.SEEDLESS | WalletType.KEYSTONE | WalletType.MNEMONIC
} => {
  return (
    wallet.type === WalletType.SEEDLESS ||
    wallet.type === WalletType.KEYSTONE ||
    wallet.type === WalletType.MNEMONIC
  )
}

const isWalletMigrated = (walletId: string): boolean => {
  const migratedActiveAccountsWalletIds = loadArrayFromStorage(
    commonStorage,
    CommonStorageKeys.MIGRATED_ACTIVE_ACCOUNTS_WALLET_IDS
  )
  return migratedActiveAccountsWalletIds.includes(walletId)
}

const markWalletAsMigrated = (walletId: string): void => {
  appendToStoredArray(
    commonStorage,
    CommonStorageKeys.MIGRATED_ACTIVE_ACCOUNTS_WALLET_IDS,
    walletId
  )
}

// Helper to check if address is missing
export const isAddressMissing = (address: string | undefined | null): boolean =>
  !address || address.trim() === ''

export const isMemonicOrSeedlessWallet = (walletType: WalletType): boolean =>
  walletType === WalletType.MNEMONIC || walletType === WalletType.SEEDLESS

// Check if wallet is a hardware wallet
export const isHardwareWalletType = (walletType: WalletType): boolean =>
  [WalletType.KEYSTONE, WalletType.LEDGER, WalletType.LEDGER_LIVE].includes(
    walletType
  )

// Rederive AVM and PVM addresses for a single account
export const rederiveAvmPvmAddressesForAccount = async ({
  account,
  wallet,
  isDeveloperMode
}: {
  account: Account
  wallet: Wallet
  isDeveloperMode: boolean
}): Promise<Account | null> => {
  try {
    Logger.info(
      `Rederiving AVM/PVM addresses for account ${account.index} (${account.id})`
    )

    const addresses = await AccountsService.getAddresses({
      walletId: wallet.id,
      walletType: wallet.type,
      accountIndex: account.index,
      isTestnet: isDeveloperMode
    })

    const newAddressAVM = addresses[NetworkVMType.AVM]
    const newAddressPVM = addresses[NetworkVMType.PVM]

    if (newAddressAVM || newAddressPVM) {
      Logger.info(
        `Repopulated AVM/PVM addresses for account ${account.index}: AVM=${newAddressAVM}, PVM=${newAddressPVM}`
      )
      return {
        ...account,
        addressAVM: newAddressAVM || account.addressAVM,
        addressPVM: newAddressPVM || account.addressPVM
      }
    }
  } catch (error) {
    Logger.error(
      `Failed to rederive AVM/PVM addresses for account ${account.index}`,
      error
    )
  }
  return null
}

// Check if account can have AVM/PVM addresses rederived
export const canRederiveAccountAddresses = (
  account: Account,
  wallet: Wallet
): boolean => {
  // Hardware wallets can only derive for index 0 without device
  if (isHardwareWalletType(wallet.type) && account.index !== 0) {
    Logger.info(
      `Skipping hardware wallet account ${account.index} - requires device connection`
    )
    return false
  }

  // Only MNEMONIC and SEEDLESS can rederive addresses
  if (!isMemonicOrSeedlessWallet(wallet.type)) {
    Logger.info(
      `Skipping account ${account.index} for wallet type ${wallet.type}`
    )
    return false
  }

  return true
}

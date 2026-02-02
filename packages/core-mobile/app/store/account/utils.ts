import { AVM, EVM, PVM, VM } from '@avalabs/avalanchejs'
import { Account } from 'store/account/types'
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
import { commonStorage } from 'utils/mmkv'
import { StorageKey } from 'resources/Constants'
import { appendToStoredArray, loadArrayFromStorage } from 'utils/mmkv/storages'
import { setIsMigratingActiveAccounts } from 'store/wallet/slice'
import { selectWalletState, WalletState } from 'store/app'
import { setAccounts, setNonActiveAccounts } from './slice'

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

export const migrateRemainingActiveAccounts = async ({
  listenerApi,
  walletId,
  walletType,
  startIndex
}: {
  listenerApi: AppListenerEffectAPI
  walletId: string
  walletType: WalletType.SEEDLESS | WalletType.MNEMONIC | WalletType.KEYSTONE
  startIndex: number
  // eslint-disable-next-line sonarjs/cognitive-complexity
}): Promise<void> => {
  const { getState, dispatch } = listenerApi
  dispatch(setIsMigratingActiveAccounts(true))

  try {
    const toastId = uuid()
    const shouldShowToast = walletType !== WalletType.SEEDLESS

    if (shouldShowToast) {
      transactionSnackbar.pending({ message: 'Adding accounts...', toastId })
    }

    const accounts = await AccountsService.fetchRemainingActiveAccounts({
      walletId,
      walletType,
      startIndex
    })

    const state = getState()
    const walletState = selectWalletState(state)
    if (walletState !== WalletState.ACTIVE) {
      Logger.error(
        'Wallet is not active, skipping migrateRemainingActiveAccounts'
      )
      dispatch(setIsMigratingActiveAccounts(false))
      global.toast?.hideAll()
      return
    }

    const accountIds = Object.keys(accounts)
    if (accountIds.length > 0) {
      // set accounts for seedless wallet, which trigger balance update
      // * seedless wallet fetches xp balances by iterating over xp addresses over all accounts
      // * so we need to wait for all accounts to be fetched to update balances
      walletType === WalletType.SEEDLESS
        ? listenerApi.dispatch(setAccounts(accounts))
        : listenerApi.dispatch(setNonActiveAccounts(accounts))

      recentAccountsStore.getState().addRecentAccounts(accountIds)

      if (shouldShowToast) {
        transactionSnackbar.success({
          message: `${accountIds.length} ${
            accountIds.length > 1 ? 'accounts' : 'account'
          } successfully added`,
          toastId
        })
      }
    } else {
      if (shouldShowToast) {
        transactionSnackbar.plain({
          message: 'No additional accounts found',
          toastId
        })
      }
    }

    markWalletAsMigrated(walletId)
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
    StorageKey.MIGRATED_ACTIVE_ACCOUNTS_WALLET_IDS
  )
  return migratedActiveAccountsWalletIds.includes(walletId)
}

const markWalletAsMigrated = (walletId: string): void => {
  appendToStoredArray(
    commonStorage,
    StorageKey.MIGRATED_ACTIVE_ACCOUNTS_WALLET_IDS,
    walletId
  )
}

// Helper to check if address is missing
export const isAddressMissing = (address: string | undefined | null): boolean =>
  !address || address.trim() === ''

// Group accounts by wallet ID
export const groupAccountsByWallet = (
  accounts: Account[]
): Map<string, Account[]> => {
  const accountsByWallet = new Map<string, Account[]>()
  for (const account of accounts) {
    const existing = accountsByWallet.get(account.walletId) || []
    existing.push(account)
    accountsByWallet.set(account.walletId, existing)
  }
  return accountsByWallet
}

// Check if wallet type can rederive XP addresses
export const canRederiveXpAddresses = (walletType: WalletType): boolean =>
  walletType === WalletType.MNEMONIC || walletType === WalletType.SEEDLESS

// Check if wallet is a hardware wallet
export const isHardwareWalletType = (walletType: WalletType): boolean =>
  [WalletType.KEYSTONE, WalletType.LEDGER, WalletType.LEDGER_LIVE].includes(
    walletType
  )

// Rederive XP addresses for a single account
export const rederiveXpAddressesForAccount = async ({
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
      `Rederiving XP addresses for account ${account.index} (${account.id})`
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
        `Repopulated XP addresses for account ${account.index}: AVM=${newAddressAVM}, PVM=${newAddressPVM}`
      )
      return {
        ...account,
        addressAVM: newAddressAVM || account.addressAVM,
        addressPVM: newAddressPVM || account.addressPVM
      }
    }
  } catch (error) {
    Logger.error(
      `Failed to rederive XP addresses for account ${account.index}`,
      error
    )
  }
  return null
}

// Check if account can have XP addresses rederived
export const canRederiveAccountXpAddresses = (
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
  if (!canRederiveXpAddresses(wallet.type)) {
    Logger.info(
      `Skipping account ${account.index} for wallet type ${wallet.type}`
    )
    return false
  }

  return true
}

// Process accounts for a single wallet and return updated accounts
export const processWalletAccountsForRepopulation = async ({
  wallet,
  accounts,
  isDeveloperMode
}: {
  wallet: Wallet
  accounts: Account[]
  isDeveloperMode: boolean
}): Promise<Record<string, Account>> => {
  const updatedAccounts: Record<string, Account> = {}

  // Skip private key wallets - they don't support AVM/PVM
  if (wallet.type === WalletType.PRIVATE_KEY) {
    Logger.info(
      `Skipping private key wallet ${wallet.id} - AVM/PVM not supported`
    )
    return updatedAccounts
  }

  // For seedless wallets, ensure session keys are derived
  if (wallet.type === WalletType.SEEDLESS) {
    await deriveMissingSeedlessSessionKeys(wallet.id)
  }

  for (const account of accounts) {
    if (!canRederiveAccountXpAddresses(account, wallet)) {
      continue
    }

    const updatedAccount = await rederiveXpAddressesForAccount({
      account,
      wallet,
      isDeveloperMode
    })

    if (updatedAccount) {
      updatedAccounts[account.id] = updatedAccount
    }
  }

  return updatedAccounts
}

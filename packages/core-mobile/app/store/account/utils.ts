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
): string {
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
        error: 'Failed to update accounts'
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
          message: `${accountIds.length} accounts successfully added`,
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
      error: 'Failed to add accounts'
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

export const isXpMigrationCompleted = (): boolean => {
  return commonStorage.getBoolean(StorageKey.XP_ADDRESSES_MIGRATED) ?? false
}

export const markXpMigrationCompleted = (): void => {
  commonStorage.set(StorageKey.XP_ADDRESSES_MIGRATED, true)
}

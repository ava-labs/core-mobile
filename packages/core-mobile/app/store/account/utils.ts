import { AVM, EVM, PVM, VM } from '@avalabs/avalanchejs'
import {
  Account,
  AccountCollection,
  PlatformAccount
} from 'store/account/types'
import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import WalletFactory from 'services/wallet/WalletFactory'
import { WalletType } from 'services/wallet/types'
import { uniqWith } from 'lodash'
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
import WalletService from 'services/wallet/WalletService'
import {
  selectPlatformAccountsByWalletId,
  setAccounts,
  setNonActiveAccounts
} from './slice'

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
  // eslint-disable-next-line sonarjs/cognitive-complexity
}): Promise<AccountCollection> => {
  const state = listenerApi.getState()
  listenerApi.dispatch(setIsMigratingActiveAccounts(true))

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

    const accountIds = Object.keys(accounts)
    if (accountIds.length > 0) {
      // set accounts for seedless wallet, which trigger balance update
      // * seedless wallet fetches xp balances by iterating over xp addresses over all accounts
      // * so we need to wait for all accounts to be fetched to update balances
      if (walletType === WalletType.SEEDLESS) {
        // add xp addresses to the platform accounts
        // const avmAddresses = Object.values(accounts).map(
        //   account => account.addressAVM
        // )
        // const pvmAddresses = Object.values(accounts).map(
        //   account => account.addressPVM
        // )
        // const platformAccounts = selectPlatformAccountsByWalletId(
        //   state,
        //   walletId
        // )

        // for (const platformAccount of platformAccounts as PlatformAccount[]) {
        //   if (platformAccount.id === `${walletId}-${NetworkVMType.AVM}`) {
        //     platformAccount.addresses = [
        //       ...platformAccount.addresses,
        //       ...avmAddresses
        //     ]
        //     accounts[NetworkVMType.AVM] = platformAccount
        //   }
        //   if (platformAccount.id === NetworkVMType.PVM) {
        //     platformAccount.addresses = [
        //       ...platformAccount.addresses,
        //       ...pvmAddresses
        //     ]
        //     accounts[NetworkVMType.PVM] = platformAccount
        //   }
        // }

        listenerApi.dispatch(setAccounts(accounts))
      } else {
        listenerApi.dispatch(setNonActiveAccounts(accounts))
      }

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
          message: 'No accounts found',
          toastId
        })
      }
    }

    markWalletAsMigrated(walletId)

    return accounts
  } catch (error) {
    Logger.error('Failed to fetch remaining active accounts', error)
    transactionSnackbar.error({
      error: 'Failed to add accounts'
    })
    return {}
  } finally {
    listenerApi.dispatch(setIsMigratingActiveAccounts(false))
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
export async function getAddressesForXP({
  isDeveloperMode,
  walletId,
  walletType,
  networkType,
  onlyWithActivity
}: {
  isDeveloperMode: boolean
  walletId: string | null
  walletType: WalletType | undefined
  networkType: NetworkVMType.AVM | NetworkVMType.PVM
  onlyWithActivity: boolean
}): Promise<string[]> {
  if (!walletId) {
    throw new Error('Wallet ID is required')
  }
  if (!walletType) {
    throw new Error('Wallet type is unknown')
  }
  try {
    const activeAddresses = await WalletService.getAddressesFromXpubXP({
      walletId,
      walletType,
      networkType,
      isTestnet: isDeveloperMode,
      onlyWithActivity
    })

    const externalAddresses = activeAddresses.externalAddresses.map(
      address => address.address
    )
    const internalAddresses = activeAddresses.internalAddresses.map(
      address => address.address
    )
    return uniqWith(
      [...externalAddresses, ...internalAddresses],
      (a, b) => a === b
    )
  } catch (error) {
    Logger.error('Failed to get addresses for XP', error)
    throw new Error('Failed to get addresses for XP')
  }
}

export const isPlatformAccount = (accountId: string): boolean =>
  accountId.includes(NetworkVMType.AVM) || accountId.includes(NetworkVMType.PVM)

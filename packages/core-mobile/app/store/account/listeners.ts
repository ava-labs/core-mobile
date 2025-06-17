import accountService from 'services/account/AccountsService'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { AnyAction } from '@reduxjs/toolkit'
import { onAppUnlocked, onLogIn, selectWalletType } from 'store/app/slice'
import { WalletType } from 'services/wallet/types'
import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import AnalyticsService from 'services/analytics/AnalyticsService'
import SeedlessService from 'seedless/services/SeedlessService'
import { isEvmPublicKey } from 'utils/publicKeys'
import { selectActiveNetwork } from 'store/network'
import { Network } from '@avalabs/core-chains-sdk'
import { recentAccountsStore } from 'new/features/accountSettings/store'
import { selectActiveWallet, selectActiveWalletId } from 'store/wallet/slice'
import BiometricsSDK from 'utils/BiometricsSDK'
import {
  selectHasBeenViewedOnce,
  setViewOnce,
  ViewOnceKey
} from 'store/viewOnce'
import {
  selectAccounts,
  selectActiveAccount,
  setAccounts,
  setNonActiveAccounts,
  setActiveAccountId
} from './slice'
import { AccountCollection } from './types'

const initAccounts = async (
  _action: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const isDeveloperMode = selectIsDeveloperMode(state)
  const activeNetwork = selectActiveNetwork(state)
  const walletType = selectWalletType(state)
  const activeAccount = selectActiveAccount(state)
  const activeWalletId = selectActiveWalletId(state)
  const activeWallet = selectActiveWallet(state)
  let accounts: AccountCollection = {}

  if (!activeWalletId) {
    throw new Error('Active wallet ID is not set')
  }
  if (!activeAccount) {
    throw new Error('Active account is not set')
  }
  if (!activeWallet) {
    throw new Error('Active wallet is not set')
  }

  const walletSecret = await BiometricsSDK.loadWalletSecret(activeWalletId)
  if (!walletSecret.success) {
    throw new Error('Failed to load wallet secret')
  }

  const acc = await accountService.createNextAccount({
    index: activeAccount.index,
    walletType,
    network: activeNetwork,
    walletId: activeWalletId
  })

  if (walletType === WalletType.SEEDLESS) {
    const title = await SeedlessService.getAccountName(0)
    const accountTitle = title ?? acc.name
    accounts[acc.id] = { ...acc, name: accountTitle }
    listenerApi.dispatch(setAccounts(accounts))

    // to avoid initial account fetching taking too long,
    // we fetch the remaining accounts in the background
    const addedAccounts = await fetchRemainingAccounts({
      walletType,
      startIndex: 1,
      listenerApi
    })

    accounts = { ...accounts, ...addedAccounts }
  } else if (
    walletType === WalletType.MNEMONIC ||
    walletType === WalletType.PRIVATE_KEY
  ) {
    accounts[acc.id] = acc
    listenerApi.dispatch(setAccounts(accounts))
  }

  if (isDeveloperMode === false) {
    AnalyticsService.captureWithEncryption('AccountAddressesUpdated', {
      addresses: Object.values(accounts).map(account => ({
        address: account.addressC,
        addressBtc: account.addressBTC,
        addressAVM: account.addressAVM ?? '',
        addressPVM: account.addressPVM ?? '',
        addressCoreEth: account.addressCoreEth ?? '',
        addressSVM: acc.addressSVM ?? ''
      }))
    })
  }
}

const fetchRemainingAccounts = async ({
  walletType,
  listenerApi,
  startIndex
}: {
  walletType: WalletType
  listenerApi: AppListenerEffectAPI
  startIndex: number
}): Promise<AccountCollection> => {
  /**
   * note:
   * adding accounts cannot be parallelized, they need to be added one-by-one.
   * otherwise race conditions occur and addresses get mixed up.
   */
  const state = listenerApi.getState()
  const activeNetwork = selectActiveNetwork(state)
  const pubKeys = await SeedlessPubKeysStorage.retrieve()
  const numberOfAccounts = pubKeys.filter(isEvmPublicKey).length

  const accounts: AccountCollection = {}
  const activeWalletId = selectActiveWalletId(state)

  if (!activeWalletId) {
    throw new Error('Active wallet ID is not set')
  }
  // fetch the remaining accounts in the background
  for (let i = startIndex; i < numberOfAccounts; i++) {
    const acc = await accountService.createNextAccount({
      index: i,
      walletType,
      network: activeNetwork,
      walletId: activeWalletId
    })
    const title = await SeedlessService.getAccountName(i)
    const accountTitle = title ?? acc.name
    accounts[acc.id] = { ...acc, name: accountTitle }
  }
  listenerApi.dispatch(setNonActiveAccounts(accounts))

  return accounts
}

// reload addresses
const reloadAccounts = async (
  _action: unknown,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const isDeveloperMode = selectIsDeveloperMode(state)
  const activeWalletId = selectActiveWalletId(state)
  const activeWallet = selectActiveWallet(state)

  if (!activeWalletId) {
    throw new Error('Active wallet ID is not set')
  }
  if (!activeWallet) {
    throw new Error('Active wallet is not set')
  }

  // all vm modules need is just the isTestnet flag
  const network = {
    isTestnet: isDeveloperMode
  } as Network

  const accounts = selectAccounts(state)
  const reloadedAccounts = await accountService.reloadAccounts({
    accounts: accounts,
    network: network as Network,
    walletId: activeWalletId,
    walletType: activeWallet.type
  })

  listenerApi.dispatch(setAccounts(reloadedAccounts))
}

const handleActiveAccountIndexChange = (
  action: ReturnType<typeof setActiveAccountId>
): void => {
  recentAccountsStore.getState().addRecentAccount(action.payload)
}

const fetchSeedlessAccountsIfNeeded = async (
  _action: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const walletType = selectWalletType(state)

  if (walletType === WalletType.SEEDLESS) {
    const accounts = selectAccounts(state)

    fetchRemainingAccounts({
      walletType,
      listenerApi,
      startIndex: Object.keys(accounts).length
    })
  }
}

const migrateSolanaAddressesIfNeeded = async (
  _action: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { dispatch, getState } = listenerApi
  const state = getState()
  const hasSolanaAddressesMigrated = selectHasBeenViewedOnce(
    ViewOnceKey.MIGRATE_SOLANA_ADDRESSES
  )(state)

  if (!hasSolanaAddressesMigrated) {
    const accounts = selectAccounts(state)
    const entries = Object.values(accounts)
    if (entries.some(account => !account.addressSVM)) {
      // reload only when there are accounts without Solana addresses
      reloadAccounts(_action, listenerApi)
    }
    dispatch(setViewOnce(ViewOnceKey.MIGRATE_SOLANA_ADDRESSES))
  }
}

export const addAccountListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    actionCreator: onLogIn,
    effect: initAccounts
  })

  startListening({
    actionCreator: toggleDeveloperMode,
    effect: reloadAccounts
  })

  startListening({
    actionCreator: setActiveAccountId,
    effect: handleActiveAccountIndexChange
  })

  startListening({
    actionCreator: onAppUnlocked,
    effect: fetchSeedlessAccountsIfNeeded
  })

  startListening({
    actionCreator: onAppUnlocked,
    effect: migrateSolanaAddressesIfNeeded
  })
}

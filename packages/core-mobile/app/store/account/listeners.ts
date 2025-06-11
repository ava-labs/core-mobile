import accountService from 'services/account/AccountsService'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { AnyAction } from '@reduxjs/toolkit'
import { onLogIn, selectWalletType } from 'store/app/slice'
import { WalletType } from 'services/wallet/types'
import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import AnalyticsService from 'services/analytics/AnalyticsService'
import SeedlessService from 'seedless/services/SeedlessService'
import { recentAccountsStore } from 'new/features/accountSettings/store'
import { EVM_BASE_DERIVATION_PATH_PREFIX } from 'utils/publicKeys'
import { Secp256k1 } from '@cubist-labs/cubesigner-sdk'
import {
  selectAccounts,
  selectActiveAccount,
  selectWalletName,
  setAccounts,
  setNonActiveAccounts,
  setActiveAccountIndex
} from './slice'
import { AccountCollection } from './types'

const initAccounts = async (
  _action: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const isDeveloperMode = selectIsDeveloperMode(state)
  const walletType = selectWalletType(state)
  const walletName = selectWalletName(state)
  const activeAccountIndex = selectActiveAccount(state)?.index ?? 0
  const accounts: AccountCollection = {}

  if (walletType === WalletType.SEEDLESS) {
    const acc = await accountService.createNextAccount({
      index: 0,
      activeAccountIndex,
      walletType,
      isTestnet: isDeveloperMode
    })

    const title = await SeedlessService.getAccountName(0)
    const accountTitle = title ?? acc.name
    accounts[acc.index] = { ...acc, name: accountTitle }
    listenerApi.dispatch(setAccounts(accounts))

    // to avoid initial account fetching taking too long,
    // we fetch the remaining accounts in the background
    fetchRemainingAccounts({
      isDeveloperMode,
      walletType,
      activeAccountIndex,
      listenerApi,
      initialAccounts: accounts // pass the initial account for analytic reporting purposes
    })
  } else if (walletType === WalletType.MNEMONIC) {
    // only add the first account for mnemonic wallet
    const acc = await accountService.createNextAccount({
      index: 0,
      activeAccountIndex,
      walletType,
      isTestnet: isDeveloperMode
    })

    const accountTitle =
      walletName && walletName.length > 0 ? walletName : acc.name
    accounts[acc.index] = { ...acc, name: accountTitle }

    listenerApi.dispatch(setAccounts(accounts))
    if (isDeveloperMode === false) {
      AnalyticsService.captureWithEncryption('AccountAddressesUpdated', {
        addresses: Object.values(accounts).map(account => ({
          address: account.addressC,
          addressBtc: account.addressBTC,
          addressAVM: account.addressAVM ?? '',
          addressPVM: account.addressPVM ?? '',
          addressCoreEth: account.addressCoreEth ?? ''
        }))
      })
    }
  }
}

const fetchRemainingAccounts = async ({
  isDeveloperMode,
  walletType,
  activeAccountIndex,
  listenerApi,
  initialAccounts
}: {
  isDeveloperMode: boolean
  walletType: WalletType
  activeAccountIndex: number
  listenerApi: AppListenerEffectAPI
  initialAccounts: AccountCollection
}): Promise<void> => {
  /**
   * note:
   * adding accounts cannot be parallelized, they need to be added one-by-one.
   * otherwise race conditions occur and addresses get mixed up.
   */
  const pubKeys = await SeedlessPubKeysStorage.retrieve()
  const numberOfAccounts = pubKeys.filter(pubKey =>
    pubKey.derivationPath.startsWith(EVM_BASE_DERIVATION_PATH_PREFIX)
  ).length

  const accounts: AccountCollection = {}
  const targetKeys = await SeedlessService.getSessionKeysList(Secp256k1.Ava)
  // fetch the remaining accounts in the background
  for (let i = 1; i < numberOfAccounts; i++) {
    const acc = await accountService.createNextAccount({
      index: i,
      activeAccountIndex,
      walletType,
      isTestnet: isDeveloperMode
    })
    const title = await SeedlessService.getAccountName(i, targetKeys)
    const accountTitle = title ?? acc.name
    accounts[acc.index] = { ...acc, name: accountTitle }
  }
  listenerApi.dispatch(setNonActiveAccounts(accounts))

  const allAccounts = { ...initialAccounts, ...accounts }
  if (isDeveloperMode === false) {
    AnalyticsService.captureWithEncryption('AccountAddressesUpdated', {
      addresses: Object.values(allAccounts).map(acc => ({
        address: acc.addressC,
        addressBtc: acc.addressBTC,
        addressAVM: acc.addressAVM ?? '',
        addressPVM: acc.addressPVM ?? '',
        addressCoreEth: acc.addressCoreEth ?? ''
      }))
    })
  }
}

// reload addresses
const reloadAccounts = async (
  _action: unknown,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const isDeveloperMode = selectIsDeveloperMode(state)

  const accounts = selectAccounts(state)
  const reloadedAccounts = await accountService.reloadAccounts(
    accounts,
    isDeveloperMode
  )

  listenerApi.dispatch(setAccounts(reloadedAccounts))
}

const handleActiveAccountIndexChange = (
  action: ReturnType<typeof setActiveAccountIndex>
): void => {
  recentAccountsStore.getState().addRecentAccount(action.payload)
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
    actionCreator: setActiveAccountIndex,
    effect: handleActiveAccountIndexChange
  })
}

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
import { recentAccountsStore } from 'new/features/accountSettings/store'
import { isEvmPublicKey } from 'utils/publicKeys'
import { Secp256k1 } from '@cubist-labs/cubesigner-sdk'
import { selectActiveNetwork } from 'store/network'
import { Network } from '@avalabs/core-chains-sdk'
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
  const activeNetwork = selectActiveNetwork(state)
  const walletType = selectWalletType(state)
  const walletName = selectWalletName(state)
  let accounts: AccountCollection = {}

  if (walletType === WalletType.SEEDLESS) {
    const acc = await accountService.createNextAccount({
      index: 0,
      activeAccountIndex: 0,
      walletType,
      network: activeNetwork
    })

    const title = await SeedlessService.getAccountName(0)
    const accountTitle = title ?? acc.name
    accounts[acc.index] = { ...acc, name: accountTitle }
    listenerApi.dispatch(setAccounts(accounts))

    // to avoid initial account fetching taking too long,
    // we fetch the remaining accounts in the background
    const addedAccounts = await fetchRemainingAccounts({
      walletType,
      activeAccountIndex: 0,
      startIndex: 1,
      listenerApi
    })

    accounts = { ...accounts, ...addedAccounts }
  } else if (walletType === WalletType.MNEMONIC) {
    // only add the first account for mnemonic wallet
    const acc = await accountService.createNextAccount({
      index: 0,
      activeAccountIndex: 0,
      walletType,
      network: activeNetwork
    })

    const accountTitle =
      walletName && walletName.length > 0 ? walletName : acc.name
    accounts[acc.index] = { ...acc, name: accountTitle }

    listenerApi.dispatch(setAccounts(accounts))
  }

  if (isDeveloperMode === false) {
    AnalyticsService.captureWithEncryption('AccountAddressesUpdated', {
      addresses: Object.values(accounts).map(acc => ({
        address: acc.addressC,
        addressBtc: acc.addressBTC,
        addressAVM: acc.addressAVM ?? '',
        addressPVM: acc.addressPVM ?? '',
        addressCoreEth: acc.addressCoreEth ?? ''
      }))
    })
  }
}

const fetchRemainingAccounts = async ({
  walletType,
  activeAccountIndex,
  startIndex,
  listenerApi
}: {
  walletType: WalletType
  activeAccountIndex: number
  startIndex: number
  listenerApi: AppListenerEffectAPI
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
  const targetKeys = await SeedlessService.getSessionKeysList(Secp256k1.Ava)
  // fetch the remaining accounts in the background
  for (let i = startIndex; i < numberOfAccounts; i++) {
    const acc = await accountService.createNextAccount({
      index: i,
      activeAccountIndex,
      walletType,
      network: activeNetwork
    })
    const title = await SeedlessService.getAccountName(i, targetKeys)
    const accountTitle = title ?? acc.name
    accounts[acc.index] = { ...acc, name: accountTitle }
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

  // all vm modules need is just the isTestnet flag
  const network = {
    isTestnet: isDeveloperMode
  } as Network

  const accounts = selectAccounts(state)
  const reloadedAccounts = await accountService.reloadAccounts(
    accounts,
    network
  )

  listenerApi.dispatch(setAccounts(reloadedAccounts))
}

const handleActiveAccountIndexChange = (
  action: ReturnType<typeof setActiveAccountIndex>
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
    const activeAccountIndex = selectActiveAccount(state)?.index ?? 0
    const accounts = selectAccounts(state)

    fetchRemainingAccounts({
      walletType,
      activeAccountIndex,
      startIndex: Object.keys(accounts).length,
      listenerApi
    })
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
    actionCreator: setActiveAccountIndex,
    effect: handleActiveAccountIndexChange
  })

  startListening({
    actionCreator: onAppUnlocked,
    effect: fetchSeedlessAccountsIfNeeded
  })
}

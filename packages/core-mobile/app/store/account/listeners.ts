import { AppStartListening } from 'store/middleware/listener'
import accountService from 'services/account/AccountsService'
import {
  reloadAccounts as reloadAccountsAction,
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { AppListenerEffectAPI } from 'store'
import { AnyAction, isAnyOf } from '@reduxjs/toolkit'
import { onLogIn, selectWalletType } from 'store/app/slice'
import { WalletType } from 'services/wallet/types'
import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import {
  selectAccounts,
  selectWalletName,
  setAccount,
  setAccounts
} from './slice'

const initAccounts = async (
  _action: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const isDeveloperMode = selectIsDeveloperMode(state)
  const walletType = selectWalletType(state)
  const walletName = selectWalletName(state)

  if (walletType === WalletType.SEEDLESS) {
    /**
     * for seedless wallet, we need to add all accounts the user has upon login
     *
     * note:
     * adding accounts cannot be parallelized, they need to be added one-by-one.
     * otherwise race conditions occur and addresses get mixed up.
     */
    const pubKeysStorage = new SeedlessPubKeysStorage()
    const pubKeys = await pubKeysStorage.retrieve()

    for (let i = 0; i < pubKeys.length; i++) {
      const acc = await accountService.createNextAccount(isDeveloperMode, i)
      const accountTitle =
        acc.index === 0 && walletName && walletName.length > 0
          ? walletName
          : acc.title
      listenerApi.dispatch(setAccount({ ...acc, title: accountTitle }))
    }
  } else if (walletType === WalletType.MNEMONIC) {
    // only add the first account for mnemonic wallet
    const acc = await accountService.createNextAccount(isDeveloperMode, 0)
    const accountTitle =
      walletName && walletName.length > 0 ? walletName : acc.title
    listenerApi.dispatch(setAccount({ ...acc, title: accountTitle }))
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
    isDeveloperMode,
    accounts
  )

  listenerApi.dispatch(setAccounts(reloadedAccounts))
}

export const addAccountListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    actionCreator: onLogIn,
    effect: initAccounts
  })

  startListening({
    matcher: isAnyOf(toggleDeveloperMode, reloadAccountsAction),
    effect: reloadAccounts
  })
}

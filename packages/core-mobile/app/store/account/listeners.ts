import { AppStartListening } from 'store/middleware/listener'
import accountService from 'services/account/AccountsService'
import {
  reloadAccounts as reloadAccountsAction,
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { AppListenerEffectAPI } from 'store'
import { AnyAction, isAnyOf } from '@reduxjs/toolkit'
import { onLogIn } from 'store/app'
import {
  addAccount,
  selectAccounts,
  setAccount,
  setAccounts,
  setActiveAccountIndex
} from './slice'

const createAndAddAccount = async (
  action: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const isDeveloperMode = selectIsDeveloperMode(state)
  const accounts = selectAccounts(state)
  const acc = await accountService.createNextAccount(isDeveloperMode, accounts)

  listenerApi.dispatch(setAccount(acc))

  // update active account index whenever we add a new account
  // if this is the first account (in the case of onLogIn)
  // no need to update as active index is already 0
  if (addAccount.match(action))
    listenerApi.dispatch(setActiveAccountIndex(acc.index))
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
    matcher: isAnyOf(onLogIn, addAccount),
    effect: createAndAddAccount
  })

  startListening({
    matcher: isAnyOf(toggleDeveloperMode, reloadAccountsAction),
    effect: reloadAccounts
  })
}

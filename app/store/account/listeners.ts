import { AppStartListening } from 'store/middleware/listener'
import accountService from 'services/account/AccountsService'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { AppListenerEffectAPI } from 'store'
import {
  addAccount,
  selectAccounts,
  setAccount,
  setAccounts,
  setActiveAccountIndex
} from './slice'

const createAndAddAccount = async (
  action: any,
  listenerApi: AppListenerEffectAPI
) => {
  const state = listenerApi.getState()
  const isDeveloperMode = selectIsDeveloperMode(state)
  const accounts = selectAccounts(state)
  const acc = await accountService.createNextAccount(isDeveloperMode, accounts)

  listenerApi.dispatch(setAccount(acc))
  listenerApi.dispatch(setActiveAccountIndex(acc.index))
}

// reload addresses
const reloadAccounts = async (
  action: any,
  listenerApi: AppListenerEffectAPI
) => {
  const state = listenerApi.getState()
  const isDeveloperMode = selectIsDeveloperMode(state)
  const accounts = selectAccounts(state)

  const reloadedAccounts = await accountService.reloadAccounts(
    isDeveloperMode,
    accounts
  )

  listenerApi.dispatch(setAccounts(reloadedAccounts))
}

export const addAccountListeners = (startListening: AppStartListening) => {
  startListening({
    actionCreator: addAccount,
    effect: createAndAddAccount
  })

  startListening({
    actionCreator: toggleDeveloperMode,
    effect: reloadAccounts
  })
}

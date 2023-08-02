import { AppStartListening } from 'store/middleware/listener'
import { AppListenerEffectAPI } from 'store'
import {
  delegationSuccess,
  selectPromptForEarnNotifications,
  setPromptForEarnNotifications
} from './slice'

/**
 * Prompt should show only once upon successful delegation.
 * If selectPromptForEarnNotifications returns undefined that means we never prompted the user.
 */
const maybePromptForEarnNotifications = async (
  action: ReturnType<typeof delegationSuccess>,
  listenerApi: AppListenerEffectAPI
) => {
  const state = listenerApi.getState()
  const promptForEarnNotifications = selectPromptForEarnNotifications(state)
  if (promptForEarnNotifications === undefined) {
    listenerApi.dispatch(setPromptForEarnNotifications(true))
  }
}

export const addNotificationsListeners = (
  startListening: AppStartListening
) => {
  startListening({
    actionCreator: delegationSuccess,
    effect: maybePromptForEarnNotifications
  })
}

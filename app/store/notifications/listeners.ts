import { AppStartListening } from 'store/middleware/listener'
import { AppListenerEffectAPI } from 'store'
import AppNavigation from 'navigation/AppNavigation'
import * as Navigation from 'utils/Navigation'
import {
  maybePromptEarnNotification,
  selectHasPromptedAfterFirstDelegation,
  setHasPromptedAfterFirstDelegation
} from './slice'

const maybePromptEarnNotificationEffect = async (
  action: ReturnType<typeof maybePromptEarnNotification>,
  listenerApi: AppListenerEffectAPI
) => {
  const state = listenerApi.getState()
  const hasPromptedAfterFirstDelegation =
    selectHasPromptedAfterFirstDelegation(state)
  if (!hasPromptedAfterFirstDelegation) {
    // @ts-ignore
    Navigation.navigate(AppNavigation.Earn.EarnNotificationsPrompt)
    listenerApi.dispatch(setHasPromptedAfterFirstDelegation(true))
  }
}

export const addNotificationsListeners = (
  startListening: AppStartListening
) => {
  startListening({
    actionCreator: maybePromptEarnNotification,
    effect: maybePromptEarnNotificationEffect
  })
}

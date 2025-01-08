import { AppListenerEffectAPI } from 'store'
import AppNavigation from 'navigation/AppNavigation'
import * as Navigation from 'utils/Navigation'
import { AnyAction } from '@reduxjs/toolkit'
import { selectHasBeenViewedOnce, setViewOnce } from 'store/viewOnce/slice'
import { ViewOnceKey } from 'store/viewOnce/types'
import NotificationsService from 'services/notifications/NotificationsService'
import { AuthorizationStatus } from '@notifee/react-native'
import { turnOnAllNotifications } from '../slice'

let isWaitingForIntroMux = false

export const handlePromptNotifications = async (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  if (isWaitingForIntroMux) return //if already waiting ignore this handler
  await waitIfIntroScreenIsYetNotDismissed(listenerApi)
  isWaitingForIntroMux = false

  const hasPromptedForNotifications = selectHasBeenViewedOnce(
    ViewOnceKey.NOTIFICATIONS_PROMPT
  )(state)

  if (hasPromptedForNotifications) return

  const authorizationStatus =
    await NotificationsService.getNotificationSettings()
  // if user has not seen the prompt and has granted permissions
  // this means user is re-logging into wallet
  // we will silently turn on all notifications
  if (
    authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    authorizationStatus === AuthorizationStatus.PROVISIONAL
  ) {
    listenerApi.dispatch(turnOnAllNotifications())
    listenerApi.dispatch(setViewOnce(ViewOnceKey.NOTIFICATIONS_PROMPT))
    return
  }

  // @ts-ignore
  Navigation.navigate(AppNavigation.Modal.EnableNotificationsPrompt)
  listenerApi.dispatch(setViewOnce(ViewOnceKey.NOTIFICATIONS_PROMPT))
}

async function waitIfIntroScreenIsYetNotDismissed(
  listenerApi: AppListenerEffectAPI
): Promise<void> {
  const { take } = listenerApi
  const state = listenerApi.getState()
  let hasSeenIntro = selectHasBeenViewedOnce(ViewOnceKey.CORE_INTRO)(state)
  while (!hasSeenIntro) {
    isWaitingForIntroMux = true
    const [{ payload }] = await take(setViewOnce.match)
    hasSeenIntro = payload === ViewOnceKey.CORE_INTRO
  }
}

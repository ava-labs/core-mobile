import { AppListenerEffectAPI } from 'store'
import { AnyAction } from '@reduxjs/toolkit'
import { selectHasBeenViewedOnce, setViewOnce } from 'store/viewOnce/slice'
import { ViewOnceKey } from 'store/viewOnce/types'
import NotificationsService from 'services/notifications/NotificationsService'
import { AuthorizationStatus } from '@notifee/react-native'
import { selectIsEnableNotificationPromptBlocked } from 'store/posthog'
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
  const isEnableNotificationPromptBlocked =
    selectIsEnableNotificationPromptBlocked(state)
  const hasPromptedForNotifications = selectHasBeenViewedOnce(
    ViewOnceKey.NOTIFICATIONS_PROMPT
  )(state)

  const authorizationStatus =
    await NotificationsService.getNotificationSettings()

  // show prompt if any of the following is true
  //   - if user has not seen the prompt
  //   - if user has denied/not determined permissions and ff is enabled
  if (
    hasPromptedForNotifications &&
    ((authorizationStatus !== AuthorizationStatus.DENIED &&
      authorizationStatus !== AuthorizationStatus.NOT_DETERMINED) ||
      isEnableNotificationPromptBlocked)
  )
    return

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

  // TODO: fix enable notifications prompt
  // Navigation.navigate(AppNavigation.Modal.EnableNotificationsPrompt)
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

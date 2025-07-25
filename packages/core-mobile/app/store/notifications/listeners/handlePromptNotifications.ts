import { AppListenerEffectAPI } from 'store/types'
import { AnyAction } from '@reduxjs/toolkit'
import { selectHasBeenViewedOnce, setViewOnce } from 'store/viewOnce/slice'
import { ViewOnceKey } from 'store/viewOnce/types'
import NotificationsService from 'services/notifications/NotificationsService'
import { AuthorizationStatus } from '@notifee/react-native'
import { selectIsEnableNotificationPromptBlocked } from 'store/posthog'
import { showAlert } from '@avalabs/k2-alpine'
import { turnOnAllNotifications } from '../slice'

let isWaitingForSolanaLaunchMux = false

export const handlePromptNotifications = async (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const isEnableNotificationPromptBlocked =
    selectIsEnableNotificationPromptBlocked(state)
  const hasPromptedForNotifications = selectHasBeenViewedOnce(
    ViewOnceKey.NOTIFICATIONS_PROMPT
  )(state)

  if (isWaitingForSolanaLaunchMux) return //if already waiting ignore this handler
  await waitIfSolanaLaunchScreenIsYetNotDismissed(listenerApi)

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

  listenerApi.dispatch(setViewOnce(ViewOnceKey.NOTIFICATIONS_PROMPT))

  showAlert({
    title: 'Enable push notifications',
    description:
      'Get notified about market updates, special offers, airdrops, balance changes and more',
    buttons: [
      {
        text: 'Not now'
      },
      {
        text: 'Turn on',
        onPress: async () => {
          const { permission } = await NotificationsService.getAllPermissions(
            false
          )
          if (permission !== 'authorized') {
            NotificationsService.openSystemSettings()
            return
          }
          listenerApi.dispatch(turnOnAllNotifications())
        }
      }
    ]
  })
}

async function waitIfSolanaLaunchScreenIsYetNotDismissed(
  listenerApi: AppListenerEffectAPI
): Promise<void> {
  const { take } = listenerApi
  const state = listenerApi.getState()
  let hasSeenSolanaLaunch = selectHasBeenViewedOnce(ViewOnceKey.SOLANA_LAUNCH)(
    state
  )
  while (!hasSeenSolanaLaunch) {
    isWaitingForSolanaLaunchMux = true
    const [{ payload }] = await take(setViewOnce.match)
    hasSeenSolanaLaunch = payload === ViewOnceKey.SOLANA_LAUNCH
  }
}

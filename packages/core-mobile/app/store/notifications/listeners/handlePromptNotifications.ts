import { AppListenerEffectAPI } from 'store/types'
import { AnyAction } from '@reduxjs/toolkit'
import { selectHasBeenViewedOnce, setViewOnce } from 'store/viewOnce/slice'
import { ViewOnceKey } from 'store/viewOnce/types'
import NotificationsService from 'services/notifications/NotificationsService'
import { AuthorizationStatus } from '@notifee/react-native'
import { selectIsEnableNotificationPromptBlocked } from 'store/posthog'
import { showAlert } from '@avalabs/k2-alpine'
import { turnOnAllNotifications } from '../slice'

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

  showAlert({
    title: 'Enable push notifications',
    description:
      'Get notified about market updates, special offers, airdrops, balance changes and more',
    buttons: [
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
      },
      {
        text: 'Not Now',
        style: 'cancel'
      }
    ]
  })
  listenerApi.dispatch(setViewOnce(ViewOnceKey.NOTIFICATIONS_PROMPT))
}

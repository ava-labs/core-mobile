import { AppListenerEffectAPI } from 'store/types'
import { AnyAction } from '@reduxjs/toolkit'
import NotificationsService from 'services/notifications/NotificationsService'
import { AuthorizationStatus } from '@notifee/react-native'
import { selectIsEnableNotificationPromptBlocked } from 'store/posthog'
import { turnOnAllNotifications } from '../slice'

export const handlePromptNotifications = async (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { getState, dispatch } = listenerApi
  const state = getState()
  const isEnableNotificationPromptBlocked =
    selectIsEnableNotificationPromptBlocked(state)
  const authorizationStatus =
    await NotificationsService.getNotificationSettings()

  // show prompt if any of the following is true
  //   - if user has denied/not determined permissions and ff is enabled
  if (
    (authorizationStatus !== AuthorizationStatus.DENIED &&
      authorizationStatus !== AuthorizationStatus.NOT_DETERMINED) ||
    isEnableNotificationPromptBlocked
  )
    return

  const { permission } = await NotificationsService.getAllPermissions(false)

  if (permission !== 'authorized') {
    NotificationsService.openSystemSettings()
  }
  dispatch(turnOnAllNotifications())
}

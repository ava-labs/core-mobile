import { showAlert } from '@avalabs/k2-alpine'
import { AuthorizationStatus } from '@notifee/react-native'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import NotificationsService from 'services/notifications/NotificationsService'
import { turnOnAllNotifications } from 'store/notifications'
import { selectIsEnableNotificationPromptBlocked } from 'store/posthog'
import {
  selectHasBeenViewedOnce,
  setViewOnce,
  ViewOnceKey
} from 'store/viewOnce'

export const usePromptEnableNotificationsIfNeeded =
  (): (() => Promise<void>) => {
    const dispatch = useDispatch()
    const isEnableNotificationPromptBlocked = useSelector(
      selectIsEnableNotificationPromptBlocked
    )
    const hasPromptedForNotifications = useSelector(
      selectHasBeenViewedOnce(ViewOnceKey.NOTIFICATIONS_PROMPT)
    )

    return useCallback(async () => {
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

      dispatch(setViewOnce(ViewOnceKey.NOTIFICATIONS_PROMPT))

      // if user has not seen the prompt and has granted permissions
      // this means user is re-logging into wallet
      // we will silently turn on all notifications
      if (
        authorizationStatus === AuthorizationStatus.AUTHORIZED ||
        authorizationStatus === AuthorizationStatus.PROVISIONAL
      ) {
        dispatch(turnOnAllNotifications())
        return
      }

      await new Promise<void>(resolve => {
        showAlert({
          title: 'Enable push notifications',
          description:
            'Get notified about market updates, special offers, airdrops, balance changes and more',
          buttons: [
            {
              text: 'Not now',
              onPress: () => {
                resolve()
              }
            },
            {
              text: 'Turn on',
              onPress: async () => {
                const { permission } =
                  await NotificationsService.getAllPermissions(false)
                if (permission !== 'authorized') {
                  NotificationsService.openSystemSettings()
                  return
                }
                dispatch(turnOnAllNotifications())
                resolve()
              }
            }
          ]
        })
      })
    }, [
      dispatch,
      hasPromptedForNotifications,
      isEnableNotificationPromptBlocked
    ])
  }

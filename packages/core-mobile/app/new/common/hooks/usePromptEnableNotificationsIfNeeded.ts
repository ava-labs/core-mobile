import { showAlert } from '@avalabs/k2-alpine'
import { AuthorizationStatus } from '@notifee/react-native'
import { waitForInteractions } from 'common/utils/waitForInteractions'
import { useCallback, useRef } from 'react'
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

    // prevents double prompt in the same session
    const inFlightRef = useRef<Promise<void> | null>(null)
    const showingAlertRef = useRef(false)

    // eslint-disable-next-line sonarjs/cognitive-complexity
    return useCallback(async () => {
      if (inFlightRef.current) return inFlightRef.current

      const run = (async () => {
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
        ) {
          return
        }

        showingAlertRef.current = true
        dispatch(setViewOnce(ViewOnceKey.NOTIFICATIONS_PROMPT))

        // if user has not seen the prompt and has granted permissions
        // this means user is re-logging into wallet
        // we will silently turn on all notifications
        if (
          authorizationStatus === AuthorizationStatus.AUTHORIZED ||
          authorizationStatus === AuthorizationStatus.PROVISIONAL
        ) {
          dispatch(turnOnAllNotifications())
          showingAlertRef.current = false
          return
        }

        await waitForInteractions()

        await new Promise<void>(resolve => {
          let done = false
          const resolveOnce = (): void => {
            if (done) return
            done = true
            showingAlertRef.current = false
            resolve()
          }

          showAlert({
            title: 'Enable push notifications',
            description:
              'Get notified about market updates, special offers, airdrops, balance changes and more',
            buttons: [
              { text: 'Not now', onPress: resolveOnce },
              {
                text: 'Turn on',
                onPress: async () => {
                  const { permission } =
                    await NotificationsService.getAllPermissions(false)
                  if (permission !== 'authorized') {
                    NotificationsService.openSystemSettings()
                    resolveOnce()
                    return
                  }
                  dispatch(turnOnAllNotifications())
                  resolveOnce()
                }
              }
            ]
          })
        })
      })().finally(() => {
        inFlightRef.current = null
      })

      inFlightRef.current = run
      return run
    }, [
      dispatch,
      hasPromptedForNotifications,
      isEnableNotificationPromptBlocked
    ])
  }

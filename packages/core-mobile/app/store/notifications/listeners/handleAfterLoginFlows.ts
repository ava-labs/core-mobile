import { AuthorizationStatus } from '@notifee/react-native'
import { AnyAction } from '@reduxjs/toolkit'
import { navigateWithPromise } from 'common/utils/navigateWithPromise'
import { AppUpdateService } from 'services/AppUpdateService/AppUpdateService'
import NotificationsService from 'services/notifications/NotificationsService'
import {
  selectIsEnableNotificationPromptBlocked,
  selectIsSolanaSupportBlocked
} from 'store/posthog'
import { AppListenerEffectAPI } from 'store/types'
import {
  selectHasBeenViewedOnce,
  setViewOnce,
  ViewOnceKey
} from 'store/viewOnce'
import { showAlert } from '@avalabs/k2-alpine'
import { waitForInteractions } from 'common/utils/waitForInteractions'
import { turnOnAllNotifications } from '../slice'

export const handleAfterLoginFlows = async (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  await promptAppUpdateScreenIfNeeded()
  await promptEnableNotificationsIfNeeded(listenerApi)
  await promptSolanaLaunchModalIfNeeded(listenerApi)
}

const promptAppUpdateScreenIfNeeded = async (): Promise<void> => {
  const appUpdateStatus = await AppUpdateService.checkAppUpdateStatus()

  if (!appUpdateStatus) return

  const hasBeenViewedAppUpdateScreen = AppUpdateService.hasSeenAppUpdateScreen(
    appUpdateStatus.version
  )
  const shouldShowAppUpdateScreen =
    hasBeenViewedAppUpdateScreen === false &&
    appUpdateStatus.needsUpdate === true
  if (shouldShowAppUpdateScreen) {
    await waitForInteractions()

    await navigateWithPromise({
      pathname: '/(signedIn)/(modals)/appUpdate',
      params: {
        appVersion: appUpdateStatus.version
      }
    })
  }
}

const promptEnableNotificationsIfNeeded = async (
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { getState, dispatch } = listenerApi
  const state = getState()
  const hasPromptedForNotifications = selectHasBeenViewedOnce(
    ViewOnceKey.NOTIFICATIONS_PROMPT
  )(state)
  const isEnableNotificationPromptBlocked =
    selectIsEnableNotificationPromptBlocked(state)

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
            const { permission } = await NotificationsService.getAllPermissions(
              false
            )
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
}

const promptSolanaLaunchModalIfNeeded = async (
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { getState } = listenerApi
  const state = getState()
  const hasBeenViewedSolanaLaunch = selectHasBeenViewedOnce(
    ViewOnceKey.SOLANA_LAUNCH
  )(state)

  const isSolanaSupportBlocked = selectIsSolanaSupportBlocked(state)

  const shouldShowSolanaLaunchModal =
    !hasBeenViewedSolanaLaunch && !isSolanaSupportBlocked
  if (shouldShowSolanaLaunchModal) {
    await waitForInteractions()

    await navigateWithPromise({
      pathname: '/(signedIn)/(modals)/solanaLaunch'
    })
  }
}

import { AppListenerEffectAPI } from 'store/types'
import NotificationsService from 'services/notifications/NotificationsService'
import Logger from 'utils/Logger'
import { selectIsEarnBlocked } from 'store/posthog'
import { Platform } from 'react-native'
import {
  selectHasBeenViewedOnce,
  setViewOnce,
  ViewOnceKey
} from 'store/viewOnce'
import { isStakeCompleteNotificationDisabled } from './utils'

export const handleNotificationCleanup = async (
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  // generic notification clean up
  await NotificationsService.setBadgeCount(0)

  await handleStakeCompleteNotificationCleanup(listenerApi)
}

export const handleStakeCompleteNotificationCleanup = async (
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()

  const isEarnBlocked = selectIsEarnBlocked(state)

  const stakeCompleteNotificationDisabled =
    await isStakeCompleteNotificationDisabled(listenerApi)

  // There's a bug in Notifee on Android 16 that requires a one-time cleanup of notifications
  // See: https://github.com/invertase/notifee/issues/515#issuecomment-1369637101
  const hasNotificationsCleanedUpOnAndroid16 = selectHasBeenViewedOnce(
    ViewOnceKey.NOTIFICATIONS_CLEANED_UP_ANDROID_16
  )(state)
  const isAndroid36OrHigher =
    Platform.OS === 'android' && Platform.Version >= 36
  const shouldCleanUpNotificationsOnceOnAndroid16 =
    hasNotificationsCleanedUpOnAndroid16 === false && isAndroid36OrHigher

  if (
    isEarnBlocked ||
    stakeCompleteNotificationDisabled ||
    shouldCleanUpNotificationsOnceOnAndroid16
  ) {
    if (stakeCompleteNotificationDisabled) {
      Logger.info(
        'user has disabled either stake complete in-app notification or system-level notification, cancelling all displayed/pending stake complete notifications.'
      )
    }

    if (isEarnBlocked) {
      Logger.info(
        'Earn feature is not enabled, cancelling all displayed/pending stake complete notifications.'
      )
    }

    if (shouldCleanUpNotificationsOnceOnAndroid16) {
      Logger.info(
        'Should clean up notifications once on Android 16 due to a Notifee bug, cancelling all displayed/pending stake complete notifications.'
      )
      listenerApi.dispatch(
        setViewOnce(ViewOnceKey.NOTIFICATIONS_CLEANED_UP_ANDROID_16)
      )
    }

    // TODO only cancel stake complete notifications
    await NotificationsService.cancelAllNotifications()
  }
}

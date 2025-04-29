import { AppListenerEffectAPI } from 'store/types'
import NotificationsService from 'services/notifications/NotificationsService'
import Logger from 'utils/Logger'
import { selectIsEarnBlocked } from 'store/posthog'
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

  if (isEarnBlocked || stakeCompleteNotificationDisabled) {
    stakeCompleteNotificationDisabled &&
      Logger.info(
        'user has disabled either stake complete in-app notification or system-level notification, cancelling all displayed/pending stake complete notifications.'
      )
    isEarnBlocked &&
      Logger.info(
        'Earn feature is not enabled, cancelling all displayed/pending stake complete notifications.'
      )

    // TODO only cancel stake complete notifications
    await NotificationsService.cancelAllNotifications()
  }
}

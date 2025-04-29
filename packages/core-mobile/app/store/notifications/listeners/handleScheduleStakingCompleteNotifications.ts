import { AppListenerEffectAPI } from 'store/types'
import { selectIsEarnBlocked } from 'store/posthog'
import Logger from 'utils/Logger'
import NotificationsService from 'services/notifications/NotificationsService'
import { StakeCompleteNotification } from '../types'
import { isStakeCompleteNotificationDisabled } from './utils'

export const handleScheduleStakingCompleteNotifications = async (
  listenerApi: AppListenerEffectAPI,
  stakeCompleteNotification: StakeCompleteNotification[]
): Promise<void> => {
  const state = listenerApi.getState()
  const isEarnBlocked = selectIsEarnBlocked(state)
  if (isEarnBlocked) {
    Logger.info(
      'Earn featured is not enabled, no notification will be scheduled'
    )
    return
  }

  const stakeCompleteNotificationDisabled =
    await isStakeCompleteNotificationDisabled(listenerApi)

  if (stakeCompleteNotificationDisabled) {
    Logger.info(
      'user has disabled either stake complete in-app notification or system-level notification, no notification will be scheduled'
    )
    return
  }

  await NotificationsService.updateStakeCompleteNotification(
    stakeCompleteNotification
  )
}

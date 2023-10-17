import { AppListenerEffectAPI } from 'store'
import NotificationsService from 'services/notifications/NotificationsService'
import { ChannelId } from 'services/notifications/channels'
import { selectNotificationSubscription } from '../slice'

export const isStakeCompleteNotificationDisabled = async (
  listenerApi: AppListenerEffectAPI
) => {
  const state = listenerApi.getState()

  const isInAppNotificationEnabled = selectNotificationSubscription(
    ChannelId.STAKING_COMPLETE
  )(state)

  const isSystemStakeCompleteNotificationBlocked =
    await NotificationsService.isStakeCompleteNotificationBlocked()
  return !isInAppNotificationEnabled || isSystemStakeCompleteNotificationBlocked
}

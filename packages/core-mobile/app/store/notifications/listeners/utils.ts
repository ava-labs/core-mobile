import { AppListenerEffectAPI } from 'store/types'
import NotificationsService from 'services/notifications/NotificationsService'
import { ChannelId } from 'services/notifications/channels'
import { selectNotificationSubscription } from '../slice'

export const isStakeCompleteNotificationDisabled = async (
  listenerApi: AppListenerEffectAPI
): Promise<undefined | boolean> => {
  const state = listenerApi.getState()

  const isStakeCompleteEnabled = selectNotificationSubscription(
    ChannelId.STAKING_COMPLETE
  )(state)

  const isStakeCompleteNotificationBlocked = async (): Promise<boolean> => {
    const blockedNotifications =
      await NotificationsService.getBlockedNotifications()
    return blockedNotifications.get(ChannelId.STAKING_COMPLETE) === true
  }
  const isSystemStakeCompleteNotificationBlocked =
    await isStakeCompleteNotificationBlocked()
  return !isStakeCompleteEnabled || isSystemStakeCompleteNotificationBlocked
}

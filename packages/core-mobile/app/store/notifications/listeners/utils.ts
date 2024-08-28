import { AppListenerEffectAPI } from 'store'
import NotificationsService from 'services/notifications/NotificationsService'
import { ChannelId } from 'services/notifications/channels'
import { selectNotificationSubscription } from '../slice'

export const isStakeCompleteNotificationDisabled = async (
  listenerApi: AppListenerEffectAPI
): Promise<undefined | boolean> => {
  const state = listenerApi.getState()

  const isInAppNotificationEnabled = selectNotificationSubscription(
    ChannelId.STAKING_COMPLETE
  )(state)

  const isStakeCompleteNotificationBlocked = async (): Promise<
    boolean | undefined
  > => {
    const blockedNotifications =
      await NotificationsService.getBlockedNotifications()
    return blockedNotifications.get(ChannelId.STAKING_COMPLETE)
  }
  const isSystemStakeCompleteNotificationBlocked =
    await isStakeCompleteNotificationBlocked()
  return !isInAppNotificationEnabled || isSystemStakeCompleteNotificationBlocked
}

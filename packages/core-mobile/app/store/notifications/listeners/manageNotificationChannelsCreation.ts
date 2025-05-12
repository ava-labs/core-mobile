import { notificationChannels } from 'services/notifications/channels'
import NotificationsService from 'services/notifications/NotificationsService'
import { AppListenerEffectAPI } from 'store/types'
import { selectAllNotificationSubscriptions } from '../slice'

export async function manageNotificationChannelsCreation(
  listenerApi: AppListenerEffectAPI
): Promise<void> {
  const { getState } = listenerApi
  const subscriptions = selectAllNotificationSubscriptions(getState())
  const blockedNotifications =
    await NotificationsService.getBlockedNotifications()
  Object.entries(subscriptions).forEach(([channelId, enabled]) => {
    const channel = notificationChannels.find(ch => ch.id === channelId)
    const isBlocked = channel && blockedNotifications.has(channel?.id)
    if (!enabled || channel === undefined || isBlocked) return
    NotificationsService.createChannel(channel)
  })
}

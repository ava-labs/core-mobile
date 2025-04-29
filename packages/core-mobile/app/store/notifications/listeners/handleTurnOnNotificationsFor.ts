import { AppListenerEffectAPI } from 'store/types'
import {
  ChannelId,
  notificationChannels
} from 'services/notifications/channels'
import NotificationsService from 'services/notifications/NotificationsService'
import { setNotificationSubscriptions } from '../slice'

export const handleTurnOnNotificationsFor = async (
  listenerApi: AppListenerEffectAPI,
  channelId: ChannelId
): Promise<void> => {
  listenerApi.dispatch(setNotificationSubscriptions([channelId, true]))
  const channelToCreate = notificationChannels.find(ch => ch.id === channelId)
  if (channelToCreate) {
    await NotificationsService.createChannel(channelToCreate)
  }
  const blockedNotifications =
    await NotificationsService.getBlockedNotifications()
  if (blockedNotifications.has(channelId)) {
    NotificationsService.openSystemSettings()
  }
}

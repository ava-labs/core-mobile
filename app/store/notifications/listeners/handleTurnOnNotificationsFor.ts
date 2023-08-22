import { AppListenerEffectAPI } from 'store'
import {
  ChannelId,
  notificationChannels
} from 'services/notifications/channels'
import NotificationsService from 'services/notifications/NotificationsService'
import { setNotificationSubscriptions } from '../slice'

export const handleTurnOnNotificationsFor = async (
  listenerApi: AppListenerEffectAPI,
  {
    channelId,
    shouldOpenSettings = true
  }: { channelId: ChannelId; shouldOpenSettings?: boolean }
) => {
  listenerApi.dispatch(setNotificationSubscriptions([channelId, true]))
  const channelToCreate = notificationChannels.find(ch => ch.id === channelId)
  if (channelToCreate) {
    await NotificationsService.createChannel(channelToCreate)
  }
  const blockedNotifications =
    await NotificationsService.getBlockedNotifications()
  if (blockedNotifications.has(channelId) && shouldOpenSettings) {
    NotificationsService.openSystemSettings()
  }
}

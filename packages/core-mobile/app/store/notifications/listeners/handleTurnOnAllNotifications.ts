import { AppListenerEffectAPI } from 'store/types'
import { notificationChannels } from 'services/notifications/channels'
import NotificationsService from 'services/notifications/NotificationsService'
import { setNotificationSubscriptions } from '../slice'

export const handleTurnOnAllNotifications = async (
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  notificationChannels.forEach(async channel => {
    listenerApi.dispatch(setNotificationSubscriptions([channel.id, true]))
  })
  NotificationsService.createChannels(notificationChannels)
  const blockedNotifications =
    await NotificationsService.getBlockedNotifications()

  const hasBlockedNotifications = notificationChannels.some(ch =>
    blockedNotifications.has(ch.id)
  )
  if (hasBlockedNotifications) {
    NotificationsService.openSystemSettings()
  }
}

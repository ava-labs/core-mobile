import notifee, { AuthorizationStatus } from '@notifee/react-native'
import { Linking, Platform } from 'react-native'
import {
  ChannelId,
  notificationChannels
} from 'services/notifications/channels'

class NotificationsService {
  /**
   * Returns all notification channels that are blocked on system level.
   * If notifications are blocked for whole app then it returns all channels.
   * Map is used for optimization purposes.
   */
  async getBlockedNotifications(): Promise<Map<ChannelId, boolean>> {
    const settings = await notifee.getNotificationSettings()
    const channels = await notifee.getChannels()

    switch (settings.authorizationStatus) {
      case AuthorizationStatus.NOT_DETERMINED:
      case AuthorizationStatus.DENIED:
        return notificationChannels.reduce((map, next) => {
          map.set(next.id as ChannelId, true)
          return map
        }, new Map<ChannelId, boolean>())
    }

    return channels.reduce((map, next) => {
      if (next.blocked) {
        map.set(next.id as ChannelId, true)
      }
      return map
    }, new Map<ChannelId, boolean>())
  }

  /**
   * Tries to pull up system prompt for allowing notifications, if that doesn't
   * work opens system settings
   */
  async getAllPermissions() {
    const promises = [] as Promise<string>[]
    notificationChannels.forEach(channel => {
      promises.push(notifee.createChannel(channel))
    })
    await Promise.allSettled(promises)
    const permission = await this.requestPermission()
    const blockedNotifications = await this.getBlockedNotifications()
    if (permission !== 'authorized' || blockedNotifications.size !== 0) {
      this.openSystemSettings()
    }
  }

  openSystemSettings() {
    if (Platform.OS === 'ios') {
      Linking.openSettings()
    } else {
      notifee.openNotificationSettings()
    }
  }

  private async requestPermission() {
    const settings = await notifee.requestPermission()
    return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
      ? 'authorized'
      : 'denied'
  }
}

export default new NotificationsService()

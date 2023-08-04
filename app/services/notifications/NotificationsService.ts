import notifee, { AuthorizationStatus } from '@notifee/react-native'
import { Linking, Platform } from 'react-native'
import { ChannelId, getAllChannels } from 'services/notifications/channels'

class NotificationsService {
  /**
   * Returns all notification channels that are blocked on system level.
   * If notifications are blocked for whole app then it returns only one record
   * "all":true
   * Map is used for optimization purposes.
   */
  async getBlockedNotifications(): Promise<Map<'all' | ChannelId, boolean>> {
    const settings = await notifee.getNotificationSettings()
    switch (settings.authorizationStatus) {
      case AuthorizationStatus.NOT_DETERMINED:
      case AuthorizationStatus.DENIED:
        return new Map<'all' | ChannelId, boolean>([['all', true]])
    }

    const channels = await notifee.getChannels()
    return channels.reduce((map, next) => {
      if (next.blocked) {
        map.set(next.id as ChannelId, true)
      }
      return map
    }, new Map<ChannelId | 'all', boolean>())
  }

  /**
   * Tries to pull up system prompt for allowing notifications, if that doesn't
   * work opens system settings
   */
  async getAllPermissions() {
    const promises = [] as Promise<string>[]
    getAllChannels().forEach(channel => {
      promises.push(notifee.createChannel(channel))
    })
    await Promise.allSettled(promises)
    const permission = await NotificationsService.requestPermission()
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

  private static async requestPermission() {
    const settings = await notifee.requestPermission()
    return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
      ? 'authorized'
      : 'denied'
  }
}

export default new NotificationsService()

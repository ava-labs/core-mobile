import notifee, {
  AndroidChannel,
  AuthorizationStatus
} from '@notifee/react-native'
import { Linking, Platform } from 'react-native'

class NotificationsService {
  async readPermission(): Promise<'authorized' | 'denied'> {
    const settings = await notifee.getNotificationSettings()
    switch (settings.authorizationStatus) {
      case AuthorizationStatus.AUTHORIZED:
      case AuthorizationStatus.PROVISIONAL:
        return 'authorized'
      case AuthorizationStatus.NOT_DETERMINED:
      case AuthorizationStatus.DENIED:
        return 'denied'
    }
  }

  async requestPermission() {
    const settings = await notifee.requestPermission()
    return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
      ? 'authorized'
      : 'denied'
  }

  openSystemSettings() {
    if (Platform.OS === 'ios') {
      Linking.openSettings()
    } else {
      notifee.openNotificationSettings()
    }
  }

  /**
   * On iOS this will fail gracefully, so we can call it anyway
   */
  createChannel(channel: AndroidChannel): Promise<string> {
    return notifee.createChannel(channel)
  }
}

export default new NotificationsService()

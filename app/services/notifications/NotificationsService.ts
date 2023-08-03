import notifee, {
  AndroidChannel,
  AuthorizationStatus,
  NotificationSettings
} from '@notifee/react-native'
import { Linking, Platform } from 'react-native'

class NotificationsService {
  /**
   * Tries to get permission from user if NOT_DETERMINED (iOS) or DENIED (Android)
   * then returns authorized or denied
   */
  async getPermission(withPrompt = false): Promise<'authorized' | 'denied'> {
    let settings = await notifee.getNotificationSettings()
    switch (settings.authorizationStatus) {
      case AuthorizationStatus.AUTHORIZED:
      case AuthorizationStatus.PROVISIONAL:
        return 'authorized'
      case AuthorizationStatus.NOT_DETERMINED:
      case AuthorizationStatus.DENIED:
        if (
          withPrompt &&
          NotificationsService.shouldAskForPermission(settings)
        ) {
          settings = await notifee.requestPermission()
          return settings.authorizationStatus ===
            AuthorizationStatus.AUTHORIZED ||
            settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
            ? 'authorized'
            : 'denied'
        }
        return 'denied'
    }
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

  private static shouldAskForPermission(settings: NotificationSettings) {
    if (Platform.OS === 'ios') {
      return settings.authorizationStatus === AuthorizationStatus.NOT_DETERMINED
    } else {
      return settings.authorizationStatus === AuthorizationStatus.DENIED
    }
  }
}

export default new NotificationsService()

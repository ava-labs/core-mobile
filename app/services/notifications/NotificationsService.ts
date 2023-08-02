import notifee, { AuthorizationStatus } from '@notifee/react-native'

class NotificationsService {
  /**
   * Tries to get permission from user if NOT_DETERMINED then returns authorized or denied
   */
  async getPermission(
    withPrompt = false
  ): Promise<'authorized' | 'denied' | 'undetermined'> {
    let settings = await notifee.getNotificationSettings()
    switch (settings.authorizationStatus) {
      case AuthorizationStatus.AUTHORIZED:
      case AuthorizationStatus.PROVISIONAL:
        return 'authorized'
      case AuthorizationStatus.NOT_DETERMINED:
        if (withPrompt) {
          settings = await notifee.requestPermission()
          return settings.authorizationStatus ===
            AuthorizationStatus.AUTHORIZED ||
            settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
            ? 'authorized'
            : 'denied'
        }
        return 'undetermined'
      case AuthorizationStatus.DENIED:
        return 'denied'
    }
  }
}

export default new NotificationsService()

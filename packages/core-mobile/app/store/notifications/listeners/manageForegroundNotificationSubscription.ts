import FCMService from 'services/fcm/FCMService'
import { AppListenerEffectAPI } from 'store/index'

export async function manageForegroundNotificationSubscription(
  listenerApi: AppListenerEffectAPI
): Promise<void> {
  const { dispatch } = listenerApi
  FCMService.listenForMessagesForeground()
  FCMService.listenForTokenRefresh(dispatch)
}

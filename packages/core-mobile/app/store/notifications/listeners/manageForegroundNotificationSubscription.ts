import FCMService from 'services/fcm/FCMService'
import { AppListenerEffectAPI } from 'store/types'
import { onFcmTokenChange } from 'store/notifications/slice'

export async function manageForegroundNotificationSubscription(
  listenerApi: AppListenerEffectAPI
): Promise<void> {
  const { dispatch } = listenerApi
  await FCMService.registerForRemoteMessages()
  FCMService.listenForMessagesForeground()
  FCMService.listenForTokenRefresh(() => {
    dispatch(onFcmTokenChange)
  })
}

import { setTokenChangeSubscriptions } from 'services/notifications/tokenChange/setTokenChangeSubscriptions'
import FCMService from 'services/fcm/FCMService'
import { registerDeviceToNotificationSender } from 'services/notifications/registerDeviceToNotificationSender'

export async function unsubscribeForTokenChange(): Promise<void> {
  const fcmToken = await FCMService.getFCMToken()
  const deviceArn = await registerDeviceToNotificationSender(fcmToken)
  await setTokenChangeSubscriptions({ tokens: [], deviceArn })
}

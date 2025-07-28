import { setPriceAlertSubscriptions } from 'services/notifications/priceAlert/setPriceAlertSubscriptions'
import FCMService from 'services/fcm/FCMService'
import { registerDeviceToNotificationSender } from 'services/notifications/registerDeviceToNotificationSender'

export async function unsubscribeForPriceAlert(): Promise<void> {
  const fcmToken = await FCMService.getFCMToken()
  const deviceArn = await registerDeviceToNotificationSender(fcmToken)
  await setPriceAlertSubscriptions({ tokens: [], deviceArn })
}

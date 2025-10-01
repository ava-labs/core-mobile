import { setPriceAlertSubscriptions } from 'services/notifications/priceAlert/setPriceAlertSubscriptions'
import FCMService from 'services/fcm/FCMService'
import { registerDeviceToNotificationSender } from 'services/notifications/registerDeviceToNotificationSender'
import AnalyticsService from 'services/analytics/AnalyticsService'

export async function unsubscribeForPriceAlert(): Promise<void> {
  const fcmToken = await FCMService.getFCMToken()
  const deviceArn = await registerDeviceToNotificationSender(fcmToken)

  await setPriceAlertSubscriptions({ tokens: [], deviceArn })

  AnalyticsService.capture('PushNotificationUnsubscribed', {
    channelType: 'price_alert'
  })
}

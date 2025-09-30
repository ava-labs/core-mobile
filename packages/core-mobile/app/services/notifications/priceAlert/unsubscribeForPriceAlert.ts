import { setPriceAlertSubscriptions } from 'services/notifications/priceAlert/setPriceAlertSubscriptions'
import FCMService from 'services/fcm/FCMService'
import { registerDeviceToNotificationSender } from 'services/notifications/registerDeviceToNotificationSender'
import AnalyticsService from 'services/analytics/AnalyticsService'

export async function unsubscribeForPriceAlert(): Promise<void> {
  const fcmToken = await FCMService.getFCMToken()
  const deviceArn = await registerDeviceToNotificationSender(fcmToken)

  try {
    await setPriceAlertSubscriptions({ tokens: [], deviceArn })

    // Track successful unsubscribe
    AnalyticsService.capture('PushNotificationUnsubscribed', {
      channelType: 'price_alert',
      reason: 'success'
    })
  } catch (error) {
    // Track failed unsubscribe
    AnalyticsService.capture('PushNotificationUnsubscribed', {
      channelType: 'price_alert',
      reason: 'failure'
    })
    throw error
  }
}

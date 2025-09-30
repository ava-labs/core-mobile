import { registerDeviceToNotificationSender } from 'services/notifications/registerDeviceToNotificationSender'
import FCMService from 'services/fcm/FCMService'
import { unSubscribeForBalanceChange } from 'services/notifications/balanceChange/unsubscribeForBalanceChange'
import AnalyticsService from 'services/analytics/AnalyticsService'

export async function unsubscribeBalanceChangeNotifications(): Promise<void> {
  const fcmToken = await FCMService.getFCMToken()

  const deviceArn = await registerDeviceToNotificationSender(fcmToken)

  try {
    await unSubscribeForBalanceChange({ deviceArn })
    // Track successful unsubscribe
    AnalyticsService.capture('PushNotificationUnsubscribed', {
      channelType: 'balance_change',
      reason: 'success'
    })
  } catch (error) {
    // Track failed unsubscribe
    AnalyticsService.capture('PushNotificationUnsubscribed', {
      channelType: 'balance_change',
      reason: 'failure'
    })
    throw error
  }
}

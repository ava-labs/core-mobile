import { registerDeviceToNotificationSender } from 'services/notifications/registerDeviceToNotificationSender'
import FCMService from 'services/fcm/FCMService'
import { unSubscribeForBalanceChange } from 'services/notifications/balanceChange/unsubscribeForBalanceChange'
import { unSubscribeForNews } from 'services/notifications/news/unsubscribeForNews'

export async function unsubscribeAllNotifications(): Promise<void> {
  const fcmToken = await FCMService.getFCMToken()
  const deviceArn = await registerDeviceToNotificationSender(fcmToken)
  await Promise.all([
    unSubscribeForBalanceChange({ deviceArn }),
    unSubscribeForNews({
      deviceArn
    })
  ])
}

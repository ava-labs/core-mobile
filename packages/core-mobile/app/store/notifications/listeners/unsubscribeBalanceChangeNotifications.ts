import FCMService from 'services/fcm/FCMService'
import { unSubscribeForBalanceChange } from 'services/notifications/balanceChange/unsubscribeForBalanceChange'
import { registerDeviceToNotificationSender } from 'services/notifications/registerDeviceToNotificationSender'

export async function unsubscribeBalanceChangeNotifications(): Promise<void> {
  const fcmToken = await FCMService.getFCMToken()
  const deviceArn = await registerDeviceToNotificationSender(fcmToken)

  await unSubscribeForBalanceChange({ deviceArn })
}

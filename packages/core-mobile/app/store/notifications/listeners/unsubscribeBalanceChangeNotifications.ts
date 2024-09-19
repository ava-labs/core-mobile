import { registerDeviceToNotificationSender } from 'services/notifications/balanceChange/registerDeviceToNotificationSender'
import FCMService from 'services/fcm/FCMService'
import { unSubscribeForBalanceChange } from 'services/notifications/balanceChange/unsubscribeForBalanceChange'

export async function unsubscribeBalanceChangeNotifications(): Promise<void> {
  const fcmToken = await FCMService.getFCMToken()
  const { deviceArn } = await registerDeviceToNotificationSender(fcmToken) //TODO: for optimisation, store deviceArn
  await unSubscribeForBalanceChange({ deviceArn })
}

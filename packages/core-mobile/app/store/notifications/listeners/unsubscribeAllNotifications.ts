import { registerDeviceToNotificationSender } from 'services/notifications/balanceChange/registerDeviceToNotificationSender'
import FCMService from 'services/fcm/FCMService'
import { unSubscribeForBalanceChange } from 'services/notifications/balanceChange/unsubscribeForBalanceChange'
import { unSubscribeForNews } from 'services/notifications/balanceChange/unsubscribeForNews'

export async function unsubscribeAllNotifications(): Promise<void> {
  const fcmToken = await FCMService.getFCMToken()
  const deviceArn = await registerDeviceToNotificationSender(fcmToken) //TODO: for optimisation, store deviceArn
  await Promise.all([
    unSubscribeForBalanceChange({ deviceArn }),
    unSubscribeForNews({
      deviceArn
    })
  ])
}

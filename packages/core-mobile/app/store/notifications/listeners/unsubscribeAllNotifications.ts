import { registerDeviceToNotificationSender } from 'services/notifications/registerDeviceToNotificationSender'
import FCMService from 'services/fcm/FCMService'
import { unSubscribeForBalanceChange } from 'services/notifications/balanceChange/unsubscribeForBalanceChange'
import { unSubscribeForNews } from 'services/notifications/news/unsubscribeForNews'
import messaging from '@react-native-firebase/messaging'
import Logger from 'utils/Logger'
import { unsubscribeForPriceAlert } from 'services/notifications/priceAlert/unsubscribeForPriceAlert'

export async function unsubscribeAllNotifications(): Promise<void> {
  const fcmToken = await FCMService.getFCMToken()
  const deviceArn = await registerDeviceToNotificationSender(fcmToken)
  await Promise.all([
    unSubscribeForBalanceChange({ deviceArn }),
    unSubscribeForNews({
      deviceArn,
      channelIds: []
    }),
    unsubscribeForPriceAlert()
  ]).catch(error => {
    //as fallback invalidate token so user doesn't get notifications
    messaging().deleteToken()
    Logger.error(`[unsubscribeAllNotifications.ts][unsubscribe]${error}`)
    throw error
  })
}

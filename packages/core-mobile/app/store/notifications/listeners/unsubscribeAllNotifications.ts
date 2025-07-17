import { registerDeviceToNotificationSender } from 'services/notifications/registerDeviceToNotificationSender'
import FCMService from 'services/fcm/FCMService'
import { unSubscribeForBalanceChange } from 'services/notifications/balanceChange/unsubscribeForBalanceChange'
import { unSubscribeForNews } from 'services/notifications/news/unsubscribeForNews'
import messaging from '@react-native-firebase/messaging'
import Logger from 'utils/Logger'
import { unsubscribeForTokenChange } from 'services/notifications/tokenChange/unsubscribeForTokenChange'

export async function unsubscribeAllNotifications(): Promise<void> {
  const fcmToken = await FCMService.getFCMToken()
  const deviceArn = await registerDeviceToNotificationSender(fcmToken)
  await Promise.all([
    unSubscribeForBalanceChange({ deviceArn }),
    unSubscribeForNews({
      deviceArn,
      channelIds: []
    }),
    unsubscribeForTokenChange()
  ]).catch(error => {
    //as fallback invalidate token so user doesn't get notifications
    messaging().deleteToken()
    Logger.error(`[unsubscribeAllNotifications.ts][unsubscribe]${error}`)
    throw error
  })
}

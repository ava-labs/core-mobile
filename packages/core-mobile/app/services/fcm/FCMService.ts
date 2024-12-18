import messaging from '@react-native-firebase/messaging'
import Logger from 'utils/Logger'
import NotificationsService from 'services/notifications/NotificationsService'
import { ACTIONS, PROTOCOLS } from 'contexts/DeeplinkContext/types'
import {
  BalanceChangeEvents,
  NotificationsBalanceChangeSchema
} from 'services/fcm/types'
import { Platform } from 'react-native'

type UnsubscribeFunc = () => void

/**
 * Wrapper for @react-native-firebase/messaging
 */
class FCMService {
  getFCMToken = async (): Promise<string> => {
    return await messaging().getToken()
  }

  listenForTokenRefresh = (callback: () => void): void => {
    messaging().onTokenRefresh(_ => {
      callback()
    })
  }

  listenForMessagesForeground = (): UnsubscribeFunc => {
    return messaging().onMessage(async remoteMessage => {
      Logger.info('A new FCM message arrived!', remoteMessage)
      const result = NotificationsBalanceChangeSchema.safeParse(remoteMessage)
      if (!result.success) {
        Logger.error(
          `[FCMService.ts][listenForMessagesForeground:NotificationsBalanceChangeSchema]${result}`
        )
        return
      }
      if (result.data.data.event === BalanceChangeEvents.BALANCES_SPENT) {
        // skip showing notification if user just spent balance in app
        return
      }
      const data = {
        accountAddress: result.data.data.accountAddress,
        chainId: result.data.data.chainId,
        transactionHash: result.data.data.transactionHash,
        url: `${PROTOCOLS.CORE}://${ACTIONS.OpenChainPortfolio}`
      }
      await NotificationsService.displayNotification({
        title: result.data.notification.title,
        body: result.data.notification.body,
        data,
        sound: result.data.notification.sound,
        channelId: result.data.notification.android?.channelId
      }).catch(Logger.error)
    })
  }
  /**
   * This method must be called outside your application lifecycle,
   * e.g. alongside your AppRegistry.registerComponent() method call at the entry point of your application code.
   */
  listenForMessagesBackground = (): void => {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      Logger.info('A new FCM message arrived in background', remoteMessage)
      if (Platform.OS === 'android') {
        //skip for android, FCM sdk handles this already
        return
      }
      const result = NotificationsBalanceChangeSchema.safeParse(remoteMessage)
      if (!result.success) {
        Logger.error(
          `[FCMService.ts][listenForMessagesBackground:NotificationsBalanceChangeSchema]${result}`
        )
        return
      }
      //show native notification
      const data = {
        accountAddress: result.data.data.accountAddress,
        chainId: result.data.data.chainId,
        transactionHash: result.data.data.transactionHash,
        url: `${PROTOCOLS.CORE}://${ACTIONS.OpenChainPortfolio}`
      }
      await NotificationsService.displayNotification({
        channelId: result.data.notification.android?.channelId,
        title: result.data.notification.title,
        body: result.data.notification.body,
        sound: result.data.notification.sound,
        data
      })
    })
  }
}
export default new FCMService()

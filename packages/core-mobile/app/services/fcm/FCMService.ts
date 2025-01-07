import messaging from '@react-native-firebase/messaging'
import Logger from 'utils/Logger'
import NotificationsService from 'services/notifications/NotificationsService'
import { ACTIONS, PROTOCOLS } from 'contexts/DeeplinkContext/types'
import {
  BalanceChangeEvents,
  NotificationsBalanceChange,
  NotificationsBalanceChangeData,
  NotificationsBalanceChangeSchema
} from 'services/fcm/types'
import { Platform } from 'react-native'
import { DisplayNotificationParams } from 'services/notifications/types'
import { ChannelId } from 'services/notifications/channels'

type UnsubscribeFunc = () => void

const EVENT_TO_CH_ID: Record<string, ChannelId> = {
  [BalanceChangeEvents.ALLOWANCE_APPROVED]: ChannelId.BALANCE_CHANGES,
  [BalanceChangeEvents.BALANCES_SPENT]: ChannelId.BALANCE_CHANGES,
  [BalanceChangeEvents.BALANCES_RECEIVED]: ChannelId.BALANCE_CHANGES
}

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
      const notificationData =
        Platform.OS === 'android' && !result.data.notification
          ? this.#prepareDataOnlyNotificationData(result.data.data)
          : this.#prepareNotificationData(result.data)

      await NotificationsService.displayNotification(notificationData).catch(
        Logger.error
      )
    })
  }
  /**
   * This method must be called outside your application lifecycle,
   * e.g. alongside your AppRegistry.registerComponent() method call at the entry point of your application code.
   */
  listenForMessagesBackground = (): void => {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      Logger.info('A new FCM message arrived in background', remoteMessage)
      const result = NotificationsBalanceChangeSchema.safeParse(remoteMessage)
      if (!result.success) {
        Logger.error(
          `[FCMService.ts][listenForMessagesBackground:NotificationsBalanceChangeSchema]${result}`
        )
        return
      }
      if (Platform.OS === 'android' && result.data.notification) {
        //skip, FCM sdk handles this already
        return
      }

      const notificationData =
        Platform.OS === 'android'
          ? this.#prepareDataOnlyNotificationData(result.data.data)
          : this.#prepareNotificationData(result.data)

      await NotificationsService.displayNotification(notificationData).catch(
        Logger.error
      )
    })
  }

  #prepareDataOnlyNotificationData = (
    fcmData: NotificationsBalanceChangeData
  ): DisplayNotificationParams => {
    if (!fcmData.title) throw Error('No notification title')
    const data = this.#extractDeepLinkData(fcmData)
    return {
      channelId: EVENT_TO_CH_ID[fcmData.event],
      title: fcmData.title,
      body: fcmData.body,
      data
    }
  }

  #prepareNotificationData = (
    fcm: NotificationsBalanceChange
  ): DisplayNotificationParams => {
    if (!fcm.notification) throw Error('No notification payload')
    const data = this.#extractDeepLinkData(fcm.data)
    return {
      channelId: fcm.notification.android?.channelId,
      title: fcm.notification.title,
      body: fcm.notification.body,
      sound: fcm.notification.sound,
      data
    }
  }

  #extractDeepLinkData = (
    fcmData: NotificationsBalanceChangeData
  ): {
    accountAddress: string
    chainId: string
    transactionHash: string
    url: string
  } => {
    return {
      accountAddress: fcmData.accountAddress,
      chainId: fcmData.chainId,
      transactionHash: fcmData.transactionHash,
      url: `${PROTOCOLS.CORE}://${ACTIONS.OpenChainPortfolio}`
    }
  }
}
export default new FCMService()

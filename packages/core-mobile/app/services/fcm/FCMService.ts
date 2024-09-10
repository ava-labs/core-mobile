import messaging from '@react-native-firebase/messaging'
import Logger from 'utils/Logger'
import NotificationsService from 'services/notifications/NotificationsService'
import { ChannelId } from 'services/notifications/channels'
import { ACTIONS, PROTOCOLS } from 'contexts/DeeplinkContext/types'
import { Dispatch } from '@reduxjs/toolkit'
import { onFcmTokenChange } from 'store/notifications'
import { NotificationsBalanceChangeSchema } from 'services/fcm/types'

type UnsubscribeFunc = () => void

/**
 * Wrapper for @react-native-firebase/messaging
 */
class FCMService {
  getFCMToken = async (): Promise<string> => {
    return await messaging().getToken()
  }

  listenForTokenRefresh = (dispatch: Dispatch): void => {
    messaging().onTokenRefresh(_ => {
      dispatch(onFcmTokenChange)
    })
  }

  listenForMessagesForeground = (): UnsubscribeFunc => {
    return messaging().onMessage(async remoteMessage => {
      Logger.info('A new FCM message arrived!', remoteMessage)
      //TO DESIGN: show in-app notification instead of native
      const result = NotificationsBalanceChangeSchema.safeParse(remoteMessage)
      if (!result.success) {
        Logger.error(
          `[FCMService.ts][listenForMessagesForeground:NotificationsBalanceChangeSchema]${result}`
        )
        return
      }
      const data = {
        accountAddress: result.data.data.accountAddress,
        chainId: result.data.data.chainId,
        transactionHash: result.data.data.transactionHash,
        url: `${PROTOCOLS.CORE}://${ACTIONS.OpenChainPortfolio}`
      }
      await NotificationsService.displayNotification({
        channelId: ChannelId.BALANCE_CHANGES,
        title: result.data.notification.title,
        body: result.data.notification.body,
        data
      })
    })
  }
  /**
   * This method must be called outside your application lifecycle,
   * e.g. alongside your AppRegistry.registerComponent() method call at the entry point of your application code.
   */
  listenForMessagesBackground = (): void => {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      Logger.info('A new FCM message arrived in background', remoteMessage)
      const result = NotificationsBalanceChangeSchema.safeParse(
        remoteMessage.data
      )
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
        channelId: ChannelId.BALANCE_CHANGES,
        title: result.data.notification.title,
        body: result.data.notification.body,
        data
      })
    })
  }
}
export default new FCMService()

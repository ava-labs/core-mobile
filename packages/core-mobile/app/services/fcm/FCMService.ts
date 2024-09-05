import messaging, {
  FirebaseMessagingTypes
} from '@react-native-firebase/messaging'
import Logger from 'utils/Logger'
import NotificationsService from 'services/notifications/NotificationsService'
import { ChannelId } from 'services/notifications/channels'
import { ACTIONS, PROTOCOLS } from 'contexts/DeeplinkContext/types'

type UnsubscribeFunc = () => void

/**
 * Wrapper for @react-native-firebase/messaging
 */
class FCMService {
  getFCMToken = async (): Promise<string> => {
    return await messaging().getToken()
  }

  listenForMessagesForeground = (): UnsubscribeFunc => {
    return messaging().onMessage(async remoteMessage => {
      Logger.info('A new FCM message arrived!', remoteMessage)
      if (this.isValidRemoteMessage(remoteMessage)) {
        //TO DESIGN: show in-app notification instead of native
        const data = {
          accountAddress: remoteMessage.data?.accountAddress ?? '',
          chainId: remoteMessage.data?.chainId ?? '',
          transactionHash: remoteMessage.data?.transactionHash ?? '',
          url: `${PROTOCOLS.CORE}://${ACTIONS.OpenChainPortfolio}`
        }
        await NotificationsService.displayNotification({
          channelId: ChannelId.BALANCE_CHANGES,
          title: remoteMessage.notification.title,
          body: remoteMessage.notification.body,
          data
        })
      }
    })
  }
  /**
   * This method must be called outside your application lifecycle,
   * e.g. alongside your AppRegistry.registerComponent() method call at the entry point of your application code.
   */
  listenForMessagesBackground = (): void => {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      Logger.info('A new FCM message arrived in background', remoteMessage)
      if (this.isValidRemoteMessage(remoteMessage)) {
        //show native notification
        const data = {
          accountAddress: remoteMessage.data?.accountAddress ?? '',
          chainId: remoteMessage.data?.chainId ?? '',
          transactionHash: remoteMessage.data?.transactionHash ?? '',
          url: `${PROTOCOLS.CORE}://${ACTIONS.OpenChainPortfolio}`
        }
        await NotificationsService.displayNotification({
          channelId: ChannelId.BALANCE_CHANGES,
          title: remoteMessage.notification.title,
          body: remoteMessage.notification.body,
          data
        })
      }
    })
  }

  private isValidRemoteMessage = (
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): remoteMessage is FirebaseMessagingTypes.RemoteMessage & {
    notification: { title: string }
  } => {
    if (!remoteMessage.notification) {
      Logger.error(`[FCMService.ts][notification empty]${remoteMessage}`)
      throw Error('Notification is empty')
    }
    if (!remoteMessage.notification.title) {
      Logger.error(
        `[FCMService.ts][notification title empty]${remoteMessage.notification}`
      )
      throw Error('Notification title is not set')
    }
    return true
  }
}
export default new FCMService()

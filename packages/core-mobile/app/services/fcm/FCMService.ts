import messaging from '@react-native-firebase/messaging'
import {
  ACTIONS,
  DeepLinkOrigin,
  PROTOCOLS
} from 'contexts/DeeplinkContext/types'
import { handleDeeplink } from 'contexts/DeeplinkContext/utils/handleDeeplink'
import { router } from 'expo-router'
import { Platform } from 'react-native'
import { CORE_UNIVERSAL_LINK_HOSTS } from 'resources/Constants'
import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  BalanceChangeData,
  BalanceChangeEvents,
  NewsData,
  NewsEvents,
  NotificationPayload,
  NotificationPayloadSchema,
  NotificationTypes
} from 'services/fcm/types'
import {
  ChannelId,
  DEFAULT_ANDROID_CHANNEL
} from 'services/notifications/channels'
import NotificationsService from 'services/notifications/NotificationsService'
import { DisplayNotificationParams } from 'services/notifications/types'
import Logger from 'utils/Logger'

type UnsubscribeFunc = () => void

export const EVENT_TO_CH_ID: Record<string, ChannelId> = {
  [BalanceChangeEvents.ALLOWANCE_APPROVED]: ChannelId.BALANCE_CHANGES,
  [BalanceChangeEvents.BALANCES_SPENT]: ChannelId.BALANCE_CHANGES,
  [BalanceChangeEvents.BALANCES_RECEIVED]: ChannelId.BALANCE_CHANGES,
  [BalanceChangeEvents.BALANCES_TRANSFERRED]: ChannelId.BALANCE_CHANGES,
  [NewsEvents.MARKET_NEWS]: ChannelId.MARKET_NEWS,
  [NewsEvents.OFFERS_AND_PROMOTIONS]: ChannelId.OFFERS_AND_PROMOTIONS,
  [NewsEvents.PRICE_ALERTS]: ChannelId.PRICE_ALERTS,
  [NewsEvents.PRODUCT_ANNOUNCEMENTS]: ChannelId.PRODUCT_ANNOUNCEMENTS
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
      const result = NotificationPayloadSchema.safeParse(remoteMessage)

      if (!result.success) {
        Logger.error(
          `[FCMService.ts][listenForMessagesForeground:NotificationPayloadSchema]`,
          result.error
        )
        return
      }

      if (
        result.data.data.event === BalanceChangeEvents.BALANCES_SPENT ||
        result.data.data.event === BalanceChangeEvents.BALANCES_TRANSFERRED
      ) {
        // skip showing notification if user just spent balance in app, or transferred balance between user's own accounts
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
    if (Platform.OS === 'ios') {
      this.handleBackgroundMessageIos()
    } else {
      this.handleBackgroundMessageAndroid()
    }
  }

  #prepareDataOnlyNotificationData = (
    fcmData: BalanceChangeData | NewsData
  ): DisplayNotificationParams => {
    if (!fcmData.title) throw Error('No notification title')
    const data = this.#extractDeepLinkData(fcmData)
    return {
      channelId: EVENT_TO_CH_ID[fcmData.event] ?? DEFAULT_ANDROID_CHANNEL,
      title: fcmData.title,
      body: fcmData.body,
      data
    }
  }

  #prepareNotificationData = (
    fcm: NotificationPayload
  ): DisplayNotificationParams => {
    if (!fcm.notification) throw Error('No notification payload')
    const data = this.#extractDeepLinkData(fcm.data)

    return {
      channelId:
        fcm.notification.android?.channelId ?? EVENT_TO_CH_ID[fcm.data.event],
      title: fcm.notification.title,
      body: fcm.notification.body,
      sound: fcm.notification.sound,
      data
    }
  }

  #extractDeepLinkData = (
    fcmData: BalanceChangeData | NewsData
  ):
    | {
        accountAddress: string
        chainId: string
        transactionHash: string
        url: string
      }
    | { url: string; channelId: string }
    | undefined => {
    if (fcmData.type === NotificationTypes.BALANCE_CHANGES) {
      return {
        accountAddress: fcmData.accountAddress,
        chainId: fcmData.chainId,
        transactionHash: fcmData.transactionHash,
        url: `${PROTOCOLS.CORE}://${ACTIONS.Portfolio}`
      }
    } else if (fcmData.type === NotificationTypes.NEWS) {
      return {
        // TODO: remove urlV2 after backend is updated to send just url for NEWS notifications
        url: fcmData.urlV2 ?? fcmData.url ?? '',
        channelId: EVENT_TO_CH_ID[fcmData.event] as string
      }
    }
  }

  private shouldSkipHandlingDeeplink = (link: string): boolean => {
    let url
    try {
      url = new URL(link)
    } catch (e) {
      return true
    }
    const protocol = url.protocol.replace(':', '')
    return (
      protocol === PROTOCOLS.WC ||
      (protocol === PROTOCOLS.HTTPS &&
        CORE_UNIVERSAL_LINK_HOSTS.includes(url.hostname) &&
        url.pathname.split('/')[1] === ACTIONS.WC) ||
      (protocol === PROTOCOLS.CORE && url.host === ACTIONS.Portfolio)
    )
  }

  private handleBackgroundMessageIos = (): void => {
    messaging().onNotificationOpenedApp(remoteMessage => {
      Logger.info('A new FCM message arrived in background', remoteMessage)
      const result = NotificationPayloadSchema.safeParse(remoteMessage)
      if (!result.success) {
        Logger.error(
          `[FCMService.ts][handleBackgroundMessageIos:NotificationPayloadSchema]`,
          result.error
        )
        return
      }

      const notificationData = this.#prepareNotificationData(result.data)

      if (
        notificationData.data?.url === undefined ||
        typeof notificationData.data.url !== 'string'
      ) {
        return
      }

      // we simply take user to portfolio/home page if the url is walletconnect or balanche-change events
      if (this.shouldSkipHandlingDeeplink(notificationData.data.url)) {
        return
      }

      handleDeeplink({
        deeplink: {
          url: notificationData.data.url,
          origin: DeepLinkOrigin.ORIGIN_NOTIFICATION
        },
        dispatch: action => action,
        isEarnBlocked: false,
        isInAppDefiBorrowBlocked: false,
        openUrl: link =>
          router.navigate({
            // @ts-ignore TODO: make routes typesafe
            pathname: '/browser',
            params: { deeplinkUrl: link.url }
          })
      })
      if (
        typeof notificationData.data?.channelId === 'string' &&
        notificationData.data?.channelId.length !== 0
      ) {
        AnalyticsService.capture('PushNotificationPressed', {
          channelId: notificationData.data.channelId,
          deeplinkUrl: notificationData.data.url
        })
      }
    })
  }

  private handleBackgroundMessageAndroid = (): void => {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      Logger.info('A new FCM message arrived in background', remoteMessage)
      const result = NotificationPayloadSchema.safeParse(remoteMessage)
      if (!result.success) {
        Logger.error(
          `[FCMService.ts][handleBackgroundMessageAndroid:NotificationPayloadSchema]`,
          result.error
        )
        return
      }

      if (result.data.notification) {
        //skip, FCM sdk handles this already
        return
      }

      const notificationData = this.#prepareDataOnlyNotificationData(
        result.data.data
      )

      await NotificationsService.displayNotification(notificationData).catch(
        Logger.error
      )
    })
  }
}

export default new FCMService()

import messaging from '@react-native-firebase/messaging'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { queryClient } from 'contexts/ReactQueryProvider'
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
  NotificationPayload,
  NotificationPayloadSchema,
  NotificationTypes
} from 'services/fcm/types'
import { DEFAULT_ANDROID_CHANNEL } from 'services/notifications/channels'
import {
  EVENT_TO_CH_ID,
  resolveChannelId
} from 'services/notifications/eventChannelMap'
import NotificationsService from 'services/notifications/NotificationsService'
import { DisplayNotificationParams } from 'services/notifications/types'
import Logger from 'utils/Logger'

type UnsubscribeFunc = () => void

/**
 * Wrapper for @react-native-firebase/messaging
 */
class FCMService {
  getFCMToken = async (): Promise<string> => {
    // registerDeviceForRemoteMessages is required on iOS before getToken().
    // It's idempotent so safe to call on every token fetch.
    if (Platform.OS === 'ios') {
      await messaging().registerDeviceForRemoteMessages()
    }
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

      // Refetch notification center list when a new notification arrives
      queryClient
        .invalidateQueries({
          queryKey: [ReactQueryKeys.NOTIFICATION_CENTER_LIST]
        })
        .catch(Logger.error)

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
      const { data } = notificationData
      if (typeof data?.url !== 'string') return

      // Capture analytics BEFORE the deeplink-skip decision so balance-change
      // and walletconnect taps are no longer dropped. Channel-id resolution
      // is centralized in `resolveChannelId` to keep precedence consistent
      // with the cold-start and warm-background paths.
      const channelId = resolveChannelId({
        data,
        fallbackEvent: result.data.data.event
      })
      AnalyticsService.capture('PushNotificationPressed', {
        channelId,
        deeplinkUrl: data.url,
        appState: 'background',
        handler: 'fcm'
      })

      // we simply take user to portfolio/home page if the url is walletconnect or balanche-change events
      if (this.shouldSkipHandlingDeeplink(data.url)) {
        return
      }

      handleDeeplink({
        deeplink: {
          url: data.url,
          origin: DeepLinkOrigin.ORIGIN_NOTIFICATION
        },
        dispatch: action => action,
        isEarnBlocked: false,
        isInAppDefiBorrowBlocked: false,
        openUrl: link =>
          router.navigate({
            pathname: '/browser',
            params: { deeplinkUrl: link.url }
          })
      })
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

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
  NotificationTypes,
  RecurringSwapData
} from 'services/fcm/types'
import {
  ChannelId,
  DEFAULT_ANDROID_CHANNEL
} from 'services/notifications/channels'
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

      // Skip user-originated balance changes (spent / transferred between own
      // accounts) — they're already visible in the app's own flows and would
      // be noisy. The skip is balance-change-specific; other notification
      // types (News / RecurringSwap) have no `event` field, so gate the
      // access on the discriminator.
      if (
        result.data.data.type === NotificationTypes.BALANCE_CHANGES &&
        (result.data.data.event === BalanceChangeEvents.BALANCES_SPENT ||
          result.data.data.event === BalanceChangeEvents.BALANCES_TRANSFERRED)
      ) {
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
    fcmData: BalanceChangeData | NewsData | RecurringSwapData
  ): DisplayNotificationParams => {
    const data = this.#extractDeepLinkData(fcmData)

    // RECURRING_SWAP payloads carry only machine-readable progress fields
    // (orderId / status / token addresses) — no `title` or `body`, since
    // those live on the envelope. The Android data-only path can't
    // construct a user-visible notification from them. The schema now rejects
    // data-only RECURRING_SWAP payloads (NotificationPayloadSchema.superRefine),
    // but keep this fallback so a regression still shows something reasonable
    // and is surfaced in logs rather than rendering a blank notification.
    if (fcmData.type === NotificationTypes.RECURRING_SWAP) {
      Logger.error(
        '[FCMService] RECURRING_SWAP arrived data-only; expected title/body in `notification` envelope'
      )
      return {
        channelId: DEFAULT_ANDROID_CHANNEL,
        title: 'Recurring swap update',
        body: 'Tap to view your recurring swap schedule.',
        data
      }
    }
    if (!fcmData.title) throw Error('No notification title')
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
    // EVENT_TO_CH_ID is keyed by BalanceChange / News event values; RECURRING_SWAP
    // has no `event` field, so fall back to the platform default channel when
    // the backend doesn't supply `android.channelId` on the envelope. We
    // intentionally don't introduce a dedicated RECURRING_SWAP channel —
    // these pushes are already gated behind the device's balance-notification
    // preference (per Sarp's PR #174) and reusing the default channel keeps
    // the channel-management UX surface aligned with that gating.
    const fallbackChannelId =
      fcm.data.type === NotificationTypes.RECURRING_SWAP
        ? DEFAULT_ANDROID_CHANNEL
        : EVENT_TO_CH_ID[fcm.data.event]
    return {
      channelId: fcm.notification.android?.channelId ?? fallbackChannelId,
      title: fcm.notification.title,
      body: fcm.notification.body,
      sound: fcm.notification.sound,
      data
    }
  }

  #extractDeepLinkData = (
    fcmData: BalanceChangeData | NewsData | RecurringSwapData
  ):
    | {
        accountAddress: string
        chainId: string
        transactionHash: string
        url: string
        channelId: string
        event: string
      }
    | { url: string; channelId: string; event: string }
    | undefined => {
    // We stamp both `channelId` AND `event` on every branch so that the
    // notification data carried into notifee.displayNotification preserves
    // enough context for `resolveChannelId` to classify the press correctly
    // when it later comes back via notifee.getInitialNotification /
    // onBackgroundEvent / onForegroundEvent. Without these fields, a
    // BALANCE_CHANGES tap retrieved through notifee would fall all the way
    // through to the DEFAULT_ANDROID_CHANNEL ('miscellaneous') fallback —
    // observed during CP-14006 device verification on iOS cold-start.
    if (fcmData.type === NotificationTypes.BALANCE_CHANGES) {
      return {
        accountAddress: fcmData.accountAddress,
        chainId: fcmData.chainId,
        transactionHash: fcmData.transactionHash,
        url: `${PROTOCOLS.CORE}://${ACTIONS.Portfolio}`,
        channelId: ChannelId.BALANCE_CHANGES,
        event: fcmData.event
      }
    } else if (fcmData.type === NotificationTypes.NEWS) {
      return {
        // TODO: remove urlV2 after backend is updated to send just url for NEWS notifications
        url: fcmData.urlV2 ?? fcmData.url ?? '',
        channelId: EVENT_TO_CH_ID[fcmData.event] as string,
        event: fcmData.event
      }
    } else if (fcmData.type === NotificationTypes.RECURRING_SWAP) {
      // Deep-link a notification tap to the schedules screen, parameterized
      // by orderId so `RecurringSchedulesScreen` auto-expands + scrolls the
      // matching card into view (`initialExpandedOrderId` prop — already
      // wired on main). The `event` field carries the type discriminator so
      // `resolveChannelId` can classify the press consistently across cold-
      // start and warm-background paths without needing a dedicated channel.
      return {
        url: `${
          PROTOCOLS.CORE
        }://recurringSwapSchedules?orderId=${encodeURIComponent(
          fcmData.orderId
        )}`,
        channelId: DEFAULT_ANDROID_CHANNEL,
        event: NotificationTypes.RECURRING_SWAP
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
      // RECURRING_SWAP payloads have no `event` field — pass undefined for
      // that variant; `resolveChannelId` already handles the missing
      // fallback (the `data.channelId` we stamped in `#extractDeepLinkData`
      // is the primary signal, fallbackEvent is the secondary).
      const channelId = resolveChannelId({
        data,
        fallbackEvent:
          result.data.data.type === NotificationTypes.RECURRING_SWAP
            ? undefined
            : result.data.data.event
      })
      AnalyticsService.capture('PushNotificationPressed', {
        channelId,
        deeplinkUrl: data.url,
        isColdStart: false,
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
        isInAppDefiBlocked: false,
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

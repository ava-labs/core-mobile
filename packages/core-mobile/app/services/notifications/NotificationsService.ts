import notifee, {
  AndroidChannel,
  AuthorizationStatus,
  Event,
  EventDetail,
  EventType,
  Notification,
  TimestampTrigger,
  TriggerNotification,
  TriggerType
} from '@notifee/react-native'
import messaging from '@react-native-firebase/messaging'
import {
  HandleNotificationCallback,
  NotificationData
} from 'contexts/DeeplinkContext/types'
import { fromUnixTime, isPast } from 'date-fns'
import { Linking, Platform } from 'react-native'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { EVENT_TO_CH_ID } from 'services/fcm/FCMService'
import {
  ChannelId,
  DEFAULT_ANDROID_CHANNEL,
  NewsChannelId,
  notificationChannels
} from 'services/notifications/channels'
import { DisplayNotificationParams } from 'services/notifications/types'
import { StakeCompleteNotification } from 'store/notifications'
import { audioFiles } from 'utils/AudioFeedback'
import Logger from 'utils/Logger'
import {
  LAUNCH_ACTIVITY,
  PressActionId,
  STAKE_COMPELETE_DEEPLINK_URL
} from './constants'

class NotificationsService {
  async getNotificationSettings(): Promise<AuthorizationStatus> {
    const settings = await notifee.getNotificationSettings()
    return settings.authorizationStatus
  }

  /**
   * Returns all notification channels that are blocked on system level.
   * If notifications are blocked for whole app then it returns all channels.
   * Map is used for optimization purposes.
   */
  async getBlockedNotifications(): Promise<Map<ChannelId, boolean>> {
    const authorizationStatus = await this.getNotificationSettings()
    const channels = await notifee.getChannels()

    switch (authorizationStatus) {
      case AuthorizationStatus.NOT_DETERMINED:
      case AuthorizationStatus.DENIED:
        return notificationChannels.reduce((map, next) => {
          map.set(next.id as ChannelId, true)
          return map
        }, new Map<ChannelId, boolean>())
    }

    return channels.reduce((map, next) => {
      if (next.blocked) {
        map.set(next.id as ChannelId, true)
      }
      return map
    }, new Map<ChannelId, boolean>())
  }

  async getBlockedNewsNotifications(): Promise<Map<NewsChannelId, boolean>> {
    const blockedNotifications = await this.getBlockedNotifications()
    blockedNotifications.delete(ChannelId.BALANCE_CHANGES)
    blockedNotifications.delete(ChannelId.STAKING_COMPLETE)
    return blockedNotifications as unknown as Map<NewsChannelId, boolean>
  }

  /**
   * Tries to pull up system prompt for allowing notifications, if that doesn't
   * work opens system settings
   */
  async getAllPermissions(shouldOpenSettings = true): Promise<{
    permission: 'authorized' | 'denied'
    blockedNotifications: Map<ChannelId, boolean>
  }> {
    const promises = [] as Promise<string>[]
    notificationChannels.forEach(channel => {
      promises.push(this.createChannel(channel))
    })
    await Promise.allSettled(promises)
    const permission = await this.requestPermission()
    const blockedNotifications = await this.getBlockedNotifications()
    if (
      (permission !== 'authorized' || blockedNotifications.size !== 0) &&
      shouldOpenSettings
    ) {
      this.openSystemSettings()
    }
    return { permission, blockedNotifications }
  }

  async openSystemSettings(): Promise<void> {
    if (Platform.OS === 'ios') {
      Linking.openSettings().catch(Logger.error)
    } else {
      notifee.openNotificationSettings().catch(Logger.error)
    }
  }

  async requestPermission(): Promise<'authorized' | 'denied'> {
    const settings = await notifee.requestPermission()
    return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
      ? 'authorized'
      : 'denied'
  }

  scheduleNotification = async ({
    txHash,
    timestamp: unixTimestamp,
    channelId,
    accountId,
    isDeveloperMode = false
  }: {
    txHash: string
    timestamp: number // unix timestamp in milliseconds
    channelId: ChannelId
    accountId: string
    isDeveloperMode?: boolean
  }): Promise<void> => {
    const timestamp = fromUnixTime(unixTimestamp).getTime()
    // Create a time-based trigger
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp
    }

    const channel = notificationChannels.find(ch => ch.id === channelId)
    if (!channel) {
      Logger.error(`ChannelId '${channelId}' is not supported.`)
      return
    }

    // Create a trigger notification
    await notifee.createTriggerNotification(
      {
        id: txHash, // use to look up if the stake notification already exists
        title: channel.title,
        body: channel.name,
        data: {
          url: STAKE_COMPELETE_DEEPLINK_URL,
          isDeveloperMode: isDeveloperMode.toString(),
          accountId: accountId
        },
        ios: {
          badgeCount: 1
        },
        android: {
          badgeCount: 1,
          channelId: channel.id,
          pressAction: {
            id: PressActionId.OPEN_CLAIM_REWARDS,
            launchActivity: LAUNCH_ACTIVITY
          }
        }
      },
      trigger
    )
  }

  getNotificationTriggerById = async (
    id?: string
  ): Promise<TriggerNotification | undefined> => {
    if (!id) return undefined
    const pendingTriggerNotifications = await notifee.getTriggerNotifications()
    return pendingTriggerNotifications.find(
      pending => pending.notification.id === id
    )
  }

  updateStakeCompleteNotification = async (
    notificationData: StakeCompleteNotification[]
  ): Promise<void> => {
    await this.cleanupNotifications()

    for (const data of notificationData) {
      setTimeout(async () => {
        if (data.txHash && data.endTimestamp) {
          const trigger = await this.getNotificationTriggerById(data.txHash)
          if (!trigger) {
            // create notification trigger
            Logger.info(
              `creating staking complete notification for tx: ${data.txHash}`
            )
            await this.scheduleNotification({
              txHash: data.txHash,
              accountId: data.accountId ?? '',
              timestamp: data.endTimestamp,
              channelId: ChannelId.STAKING_COMPLETE,
              isDeveloperMode: data.isDeveloperMode
            })
          }
        }
      }, 500)
    }
  }

  onForegroundEvent = (callback: HandleNotificationCallback): (() => void) => {
    return notifee.onForegroundEvent(async ({ type, detail }) => {
      this.handleNotificationEvent({
        type,
        detail,
        callback
      }).catch(reason =>
        Logger.error(`[NotificationsService.ts][onForegroundEvent]${reason}`)
      )
    })
  }

  /**
   * Registers the notifee background event handler.
   *
   * MUST be called at the entry point of the app (e.g. index.js) BEFORE
   * AppRegistry.registerComponent — notifee only supports a single background
   * handler, so this should be the only call site for notifee.onBackgroundEvent.
   *
   * Background events run as a headless JS task without React context, so we
   * cannot dispatch redux actions or update UI here. We also intentionally do
   * NOT capture the press analytics event here: on cold start, PostHog /
   * AnalyticsService is not configured yet (configure runs after redux store
   * rehydration completes), so the call would be silently dropped because
   * AnalyticsService.isEnabled is still undefined.
   *
   * Cold-start press analytics + deeplink handling is performed later, once the
   * React tree is mounted, via {@link getInitialNotification}.
   */
  registerBackgroundNotificationHandler = (): void => {
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type !== EventType.PRESS) return

      if (detail?.notification?.id) {
        await this.cancelTriggerNotification(detail.notification.id).catch(
          reason =>
            Logger.error(
              `[NotificationsService.ts][registerBackgroundNotificationHandler]${reason}`
            )
        )
      }
    })
  }

  incrementBadgeCount = async (incrementBy?: number): Promise<void> => {
    await notifee.incrementBadgeCount(incrementBy)
  }

  decrementBadgeCount = async (decrementBy?: number): Promise<void> => {
    await notifee.decrementBadgeCount(decrementBy)
  }

  setBadgeCount = async (count: number): Promise<void> => {
    await notifee.setBadgeCount(count)
  }

  cancelTriggerNotification = async (id?: string): Promise<void> => {
    if (!id) return
    await notifee.cancelTriggerNotification(id)
  }

  handleNotificationPress = async ({
    detail,
    callback
  }: {
    detail: EventDetail
    callback: HandleNotificationCallback
  }): Promise<void> => {
    await this.decrementBadgeCount(1)
    if (detail?.notification?.id) {
      await this.cancelTriggerNotification(detail.notification.id)
    }

    if (detail?.notification?.data) {
      AnalyticsService.capture('PushNotificationPressed', {
        channelId: detail.notification?.data?.channelId as string,
        deeplinkUrl: detail.notification?.data?.url as string
      })
    }

    callback(detail?.notification?.data)
  }

  handleNotificationEvent = async ({
    type,
    detail,
    callback
  }: Event & {
    callback: HandleNotificationCallback
  }): Promise<void> => {
    switch (type) {
      case EventType.DELIVERED:
        await this.incrementBadgeCount(1)
        break
      case EventType.PRESS:
        await this.handleNotificationPress({
          detail,
          callback
        })
    }
  }

  cleanupNotifications = async (): Promise<void> => {
    const pendings = await notifee.getTriggerNotifications()
    for (const pending of pendings) {
      const timestamp = fromUnixTime(
        (pending.trigger as TimestampTrigger).timestamp
      )
      if (isPast(timestamp) && pending.notification?.id) {
        await notifee.cancelTriggerNotification(pending.notification.id)
      }
    }
  }

  /**
   * Picks up a notification press that caused the app to cold-start.
   *
   * Two display paths exist on Android, each surfaced through a different API:
   *
   *  1. Data-only FCM messages (current backend format) are displayed by
   *     notifee inside FCMService.handleBackgroundMessageAndroid. The press
   *     on such notifications can only be retrieved via
   *     `notifee.getInitialNotification()` — `messaging().getInitialNotification()`
   *     returns null for them because they were NOT displayed by the FCM SDK.
   *
   *  2. Legacy `notification + data` FCM payloads are displayed directly by
   *     the FCM SDK. Their press is retrievable via
   *     `messaging().getInitialNotification()`.
   *
   * Previously we only checked path (2), which meant every Android push press
   * from the data-only path was lost on cold start — the root cause of the
   * Android `PushNotificationPressed` under-reporting (CP-14006).
   *
   * On iOS this method is mostly a no-op for analytics because notifee's
   * `getInitialNotification` is deprecated on iOS and APNs-displayed
   * notifications are handled via `onForegroundEvent` / `onNotificationOpenedApp`.
   */
  getInitialNotification = async (
    callback: HandleNotificationCallback
  ): Promise<void> => {
    const [notifeeInitial, fcmInitial] = await Promise.all([
      notifee.getInitialNotification().catch(reason => {
        Logger.error(
          `[NotificationsService.ts][getInitialNotification:notifee]${reason}`
        )
        return null
      }),
      messaging()
        .getInitialNotification()
        .catch(reason => {
          Logger.error(
            `[NotificationsService.ts][getInitialNotification:fcm]${reason}`
          )
          return null
        })
    ])

    // Prefer notifee, since data-only is the current backend format and the
    // legacy `notification` payload is being phased out.
    const notifeeData = notifeeInitial?.notification?.data as
      | NotificationData
      | undefined

    if (notifeeData?.url) {
      const channelId =
        notifeeInitial?.notification?.android?.channelId ??
        (typeof notifeeData.channelId === 'string'
          ? notifeeData.channelId
          : undefined) ??
        EVENT_TO_CH_ID[notifeeData.event as string] ??
        DEFAULT_ANDROID_CHANNEL
      AnalyticsService.capture('PushNotificationPressed', {
        channelId,
        deeplinkUrl: String(notifeeData.url)
      })
      callback(notifeeData)
      return
    }

    const fcmData = fcmInitial?.data as NotificationData | undefined

    if (fcmData?.url) {
      AnalyticsService.capture('PushNotificationPressed', {
        channelId:
          EVENT_TO_CH_ID[fcmData.event as string] ?? DEFAULT_ANDROID_CHANNEL,
        deeplinkUrl: String(fcmData.url)
      })
      callback(fcmData)
      return
    }

    callback(undefined)
  }

  cancelAllNotifications = async (): Promise<void> => {
    await notifee.cancelAllNotifications()
  }

  createChannel = async (channel: AndroidChannel): Promise<string> => {
    return notifee.createChannel(channel)
  }

  createChannels = async (channels: AndroidChannel[]): Promise<void> => {
    return notifee.createChannels(channels)
  }

  /**
   * @param channelId
   * @param title
   * @param body
   * @param sound For iOS only
   * @param data
   */
  displayNotification = async ({
    channelId,
    title,
    body,
    sound,
    data
  }: DisplayNotificationParams): Promise<void> => {
    const notification: Notification = {
      title,
      body,
      android: {
        smallIcon: 'notification_icon',
        // pressAction is needed if you want the notification to open the app when pressed
        pressAction: {
          id: PressActionId.OPEN_PORTFOLIO,
          launchActivity: LAUNCH_ACTIVITY
        },
        channelId: channelId ?? ''
      },
      data
    }
    notification.ios = { sound: sound ?? audioFiles.Default.file }
    await notifee.displayNotification(notification).catch(Logger.error)
  }
}

export default new NotificationsService()

import notifee, {
  AuthorizationStatus,
  TimestampTrigger,
  TriggerNotification,
  TriggerType,
  Event,
  EventType,
  EventDetail
} from '@notifee/react-native'
import {
  DeepLinkOrigin,
  NotificationCallbackProps
} from 'contexts/DeeplinkContext/types'
import { fromUnixTime, isPast } from 'date-fns'
import { Linking, Platform } from 'react-native'
import {
  ChannelId,
  notificationChannels
} from 'services/notifications/channels'
import { StakeCompleteNotification } from 'store/notifications'
import Logger from 'utils/Logger'
import {
  LAUNCH_ACTIVITY,
  OPEN_CLAIM_REWARDS_PRESS_ACTION_ID,
  STAKE_COMPELETE_DEEPLINK_URL
} from './constants'

class NotificationsService {
  /**
   * Returns all notification channels that are blocked on system level.
   * If notifications are blocked for whole app then it returns all channels.
   * Map is used for optimization purposes.
   */
  async getBlockedNotifications(): Promise<Map<ChannelId, boolean>> {
    const settings = await notifee.getNotificationSettings()
    const channels = await notifee.getChannels()

    switch (settings.authorizationStatus) {
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

  /**
   * Tries to pull up system prompt for allowing notifications, if that doesn't
   * work opens system settings
   */
  async getAllPermissions() {
    const promises = [] as Promise<string>[]
    notificationChannels.forEach(channel => {
      promises.push(notifee.createChannel(channel))
    })
    await Promise.allSettled(promises)
    const permission = await this.requestPermission()
    const blockedNotifications = await this.getBlockedNotifications()
    if (permission !== 'authorized' || blockedNotifications.size !== 0) {
      this.openSystemSettings()
    }
  }

  openSystemSettings() {
    if (Platform.OS === 'ios') {
      Linking.openSettings()
    } else {
      notifee.openNotificationSettings()
    }
  }

  private async requestPermission() {
    const settings = await notifee.requestPermission()
    return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
      ? 'authorized'
      : 'denied'
  }

  scheduleNotification = async ({
    txHash,
    timestamp,
    channelId,
    accountIndex,
    isDeveloperMode = false
  }: {
    txHash: string
    timestamp: number // unix timestamp in milliseconds
    channelId: ChannelId
    accountIndex?: number
    isDeveloperMode?: boolean
  }) => {
    // Create a time-based trigger
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: timestamp / 1000 // convert to seconds
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
        body: channel.subtitle,
        data: {
          url: STAKE_COMPELETE_DEEPLINK_URL,
          isDeveloperMode: isDeveloperMode.toString(),
          accountIndex: accountIndex ?? 0
        },
        ios: {
          badgeCount: 1
        },
        android: {
          badgeCount: 1,
          channelId: channel.id,
          pressAction: {
            id: OPEN_CLAIM_REWARDS_PRESS_ACTION_ID,
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
  ) => {
    await this.cleanupNotifications()

    notificationData.forEach(async data => {
      setTimeout(async () => {
        if (data.txHash && data.endTimestamp) {
          const trigger = await this.getNotificationTriggerById(data.txHash)
          if (!trigger) {
            // create notification trigger
            await this.scheduleNotification({
              txHash: data.txHash,
              accountIndex: data.accountIndex,
              timestamp: data.endTimestamp,
              channelId: ChannelId.STAKING_COMPLETE,
              isDeveloperMode: data.isDeveloperMode
            })
          }
        }
      }, 500)
    })
  }

  onForegroundEvent = (observer: (event: Event) => void): (() => void) => {
    return notifee.onForegroundEvent(observer)
  }

  onBackgroundEvent = (observer: (event: Event) => Promise<void>) => {
    return notifee.onBackgroundEvent(observer)
  }

  incrementBadgeCount = async (incrementBy?: number) => {
    notifee.incrementBadgeCount(incrementBy)
  }

  decrementBadgeCount = async (decrementBy?: number) => {
    notifee.decrementBadgeCount(decrementBy)
  }

  setBadgeCount = async (count: number) => {
    notifee.setBadgeCount(count)
  }

  cancelTriggerNotification = async (id?: string) => {
    if (!id) return
    await notifee.cancelTriggerNotification(id)
  }

  handleNotificationPress = async ({
    detail,
    callback
  }: {
    detail: EventDetail
    callback?: ({
      url,
      accountIndex,
      origin,
      isDevMode
    }: NotificationCallbackProps) => void
  }) => {
    this.decrementBadgeCount(1)
    if (detail?.notification?.id) {
      await this.cancelTriggerNotification(detail.notification.id)
    }

    if (detail?.notification?.data?.url) {
      callback?.({
        url: detail.notification.data.url as string,
        accountIndex: detail.notification.data.accountIndex as number,
        origin: DeepLinkOrigin.ORIGIN_NOTIFICATION,
        isDevMode: Boolean(detail?.notification?.data?.isDeveloperMode) ?? false
      })
    }
  }

  handleNotificationEvent = async ({
    type,
    detail,
    callback
  }: Event & {
    callback?: ({
      url,
      accountIndex,
      origin,
      isDevMode
    }: NotificationCallbackProps) => void
  }) => {
    switch (type) {
      case EventType.DELIVERED:
        this.incrementBadgeCount(1)
        break
      case EventType.PRESS:
        this.handleNotificationPress({
          detail,
          callback
        })
        break
    }
  }

  cleanupNotifications = async () => {
    const pendings = await notifee.getTriggerNotifications()
    pendings.forEach(async pending => {
      const timestamp = fromUnixTime(
        (pending.trigger as TimestampTrigger).timestamp
      )
      if (isPast(timestamp) && pending.notification?.id) {
        await notifee.cancelTriggerNotification(pending.notification.id)
      }
    })
  }

  // only for Android to obtain the notification data when the app is in the background
  // for iOS, it is handled in the onForegroundEvent PRESS event
  getInitialNotification = async () => {
    return notifee.getInitialNotification()
  }

  isStakeCompleteNotificationBlocked = async () => {
    const blockedNotifications = await this.getBlockedNotifications()
    return blockedNotifications.get(ChannelId.STAKING_COMPLETE)
  }

  cancelAllNotifications = async () => {
    await notifee.cancelAllNotifications()
  }
}

export default new NotificationsService()

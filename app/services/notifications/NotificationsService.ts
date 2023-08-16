import notifee, {
  AuthorizationStatus,
  TimestampTrigger,
  TriggerNotification,
  TriggerType,
  Event,
  EventType,
  EventDetail
} from '@notifee/react-native'
import { DeepLinkOrigin } from 'contexts/DeeplinkContext/types'
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
  OPEN_CLAIM_REWARDS,
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
    isDeveloperMode = false
  }: {
    txHash: string
    timestamp: number // unix timestamp *milliseconds
    channelId: ChannelId
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
          isDeveloperMode: isDeveloperMode.toString()
        },
        ios: {
          badgeCount: 1
        },
        android: {
          badgeCount: 1,
          channelId: channel.id,
          pressAction: {
            id: OPEN_CLAIM_REWARDS,
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
    triggerData: StakeCompleteNotification[],
    isDeveloperMode?: boolean
  ) => {
    await this.cleanupNotifications()

    triggerData.forEach(async data => {
      if (data.txHash && data.endTimestamp) {
        const trigger = await this.getNotificationTriggerById(data.txHash)
        if (!trigger) {
          // create notification trigger
          await this.scheduleNotification({
            txHash: data.txHash,
            timestamp: data.endTimestamp,
            channelId: ChannelId.STAKING_COMPLETE,
            isDeveloperMode
          })
        }
      }
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
    callback?: (
      url: string,
      origin: DeepLinkOrigin,
      isDeveloperMode: boolean
    ) => void
  }) => {
    this.decrementBadgeCount(1)
    if (detail?.notification?.id) {
      await this.cancelTriggerNotification(detail.notification.id)
    }

    if (detail?.notification?.data?.url) {
      callback?.(
        detail.notification.data.url as string,
        DeepLinkOrigin.ORIGIN_NOTIFICATION,
        Boolean(detail?.notification?.data?.isDeveloperMode) ?? false
      )
    }
  }

  handleNotificationEvent = async ({
    type,
    detail,
    callback
  }: Event & {
    callback?: (
      url: string,
      origin: DeepLinkOrigin,
      isDeveloperMode: boolean
    ) => void
  }) => {
    switch (type) {
      case EventType.DELIVERED:
        this.incrementBadgeCount(1)
        break
      case EventType.PRESS:
        await this.handleNotificationPress({
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
}

export default new NotificationsService()

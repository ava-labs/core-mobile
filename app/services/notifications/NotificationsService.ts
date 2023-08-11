import notifee, {
  AuthorizationStatus,
  TimestampTrigger,
  TriggerNotification,
  TriggerType,
  Event,
  RepeatFrequency,
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
import { stakeCompleteTriggerData } from 'store/notifications'

class NotificationsService {
  /**
   * Returns all notification channels that are blocked on system level.
   * If notifications are blocked for whole app then it returns only one record
   * "all":true
   * Map is used for optimization purposes.
   */
  async getBlockedNotifications(): Promise<Map<'all' | ChannelId, boolean>> {
    const settings = await notifee.getNotificationSettings()
    switch (settings.authorizationStatus) {
      case AuthorizationStatus.NOT_DETERMINED:
      case AuthorizationStatus.DENIED:
        return new Map<'all' | ChannelId, boolean>([['all', true]])
    }

    const channels = await notifee.getChannels()
    return channels.reduce((map, next) => {
      if (next.blocked) {
        map.set(next.id as ChannelId, true)
      }
      return map
    }, new Map<ChannelId | 'all', boolean>())
  }

  async isStakeCompletedNotificationEnabled() {
    const blockedNotifications = await this.getBlockedNotifications()
    return (
      !blockedNotifications.get('all') &&
      !blockedNotifications.get(ChannelId.STAKING_COMPLETE)
    )
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

  createNotificationTrigger = async ({
    nodeId,
    timestamp,
    channelId,
    isDeveloperMode = false
  }: {
    nodeId: string
    timestamp: number // unix timestamp *seconds
    channelId: ChannelId
    isDeveloperMode?: boolean
  }) => {
    // Create a time-based trigger
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: timestamp / 1000, // convert to seconds
      repeatFrequency: RepeatFrequency.DAILY
    }

    const channel = notificationChannels.find(ch => ch.id === channelId)
    if (!channel) return

    // Create a trigger notification
    await notifee.createTriggerNotification(
      {
        id: nodeId, // use to look up if the stake notifiaction already exists
        title: channel.title,
        body: channel.subtitle,
        data: {
          url: 'core://stakecomplete',
          isDeveloperMode: isDeveloperMode.toString()
        },
        ios: {
          badgeCount: 1
        },
        android: {
          badgeCount: 1,
          channelId: channel.id,
          pressAction: {
            id: 'open-claim-rewards',
            launchActivity: 'com.avaxwallet.MainActivity'
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

  updateStakeCompleteNotificationTriggers = async (
    triggerData: stakeCompleteTriggerData[],
    isDeveloperMode?: boolean
  ) => {
    await this.cleanupNotificationTriggers()

    triggerData.forEach(async data => {
      if (data.nodeId && data.endTimestamp) {
        const trigger = await this.getNotificationTriggerById(data.nodeId)
        if (!trigger) {
          // create notification trigger
          await this.createNotificationTrigger({
            nodeId: data.nodeId,
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
    notifee.incrementBadgeCount(incrementBy).then(() => notifee.getBadgeCount())
  }

  decrementBadgeCount = async (decrementBy?: number) => {
    notifee.decrementBadgeCount(decrementBy).then(() => notifee.getBadgeCount())
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
      default:
        break
    }
  }

  cleanupNotificationTriggers = async () => {
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

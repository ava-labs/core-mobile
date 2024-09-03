import notifee, {
  AndroidChannel,
  AuthorizationStatus,
  Event,
  EventDetail,
  EventType,
  TimestampTrigger,
  TriggerNotification,
  TriggerType
} from '@notifee/react-native'
import { fromUnixTime, isPast } from 'date-fns'
import { Linking, Platform } from 'react-native'
import {
  ChannelId,
  notificationChannels
} from 'services/notifications/channels'
import { StakeCompleteNotification } from 'store/notifications'
import Logger from 'utils/Logger'
import { HandleNotificationCallback } from 'contexts/DeeplinkContext/types'
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
  async getAllPermissions(shouldOpenSettings = true): Promise<{
    permission: string
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

  openSystemSettings(): void {
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
    accountIndex,
    isDeveloperMode = false
  }: {
    txHash: string
    timestamp: number // unix timestamp in milliseconds
    channelId: ChannelId
    accountIndex?: number
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
              accountIndex: data.accountIndex,
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
      await this.handleNotificationEvent({
        type,
        detail,
        callback
      })
    })
  }

  onBackgroundEvent = (callback: HandleNotificationCallback): void => {
    return notifee.onBackgroundEvent(async ({ type, detail }) => {
      await this.handleNotificationEvent({
        type,
        detail,
        callback
      })
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
        break
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

  // only for Android to obtain the notification data when the app is in the background
  // for iOS, it is handled in the onForegroundEvent PRESS event
  getInitialNotification = async (
    callback: HandleNotificationCallback
  ): Promise<void> => {
    const event = await notifee.getInitialNotification()
    if (event) {
      callback(event.notification.data)
    }
  }

  cancelAllNotifications = async (): Promise<void> => {
    await notifee.cancelAllNotifications()
  }

  createChannel = async (channel: AndroidChannel): Promise<string> => {
    return notifee.createChannel(channel)
  }

  displayNotification = async ({
    channelId,
    title,
    body,
    data
  }: {
    channelId: ChannelId
    title: string
    body?: string
    data?: { [p: string]: string | object | number }
  }): Promise<void> => {
    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId,
        // pressAction is needed if you want the notification to open the app when pressed
        pressAction: {
          id: 'openC-ChainPortfolio'
        }
      },
      data
    })
  }
}

export default new NotificationsService()

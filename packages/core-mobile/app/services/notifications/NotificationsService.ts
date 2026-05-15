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
import { AppState, Linking, Platform } from 'react-native'
import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  ChannelId,
  NewsChannelId,
  notificationChannels
} from 'services/notifications/channels'
import { resolveChannelId } from 'services/notifications/eventChannelMap'
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
  /**
   * Notification data from a PRESS event delivered via the notifee background
   * headless task. Held until either:
   *
   *  - The React tree becomes active (warm-background case) and consumes it
   *    via {@link handlePendingBackgroundPress}, which captures analytics
   *    and routes the deeplink callback.
   *  - {@link getInitialNotification} runs on cold start and drains any
   *    stale value via {@link consumePendingBackgroundPress} so the AppState
   *    listener doesn't replay the same press once the user later
   *    backgrounds and re-activates the app.
   *
   * Cold-start press analytics + deeplink are owned by
   * {@link getInitialNotification}, which is why this field is intentionally
   * not captured inside the notifee.onBackgroundEvent handler: capturing
   * there would double-count cold-start presses (one `isColdStart: false`
   * from the headless task + one `isColdStart: true` from getInitialNotification
   * — observed during CP-14006 device verification).
   */
  private pendingBackgroundPress: NotificationData | undefined

  /**
   * Notifee only supports a single background event handler. We guard against
   * repeat calls so a future call site (e.g. an accidental import in another
   * entry point or a hot-reload re-evaluation) cannot silently overwrite the
   * registered handler — it would log a warning instead.
   */
  private backgroundHandlerRegistered = false

  /**
   * Callback registered by the React-mounted DeeplinkContext to receive a
   * stashed background press AS SOON AS it lands, without waiting for the
   * next AppState 'active' edge.
   *
   * This is needed because notifee's headless onBackgroundEvent on Android
   * release builds can fire *after* AppState has already transitioned to
   * 'active' (observed up to ~770 ms late during CP-14006 device
   * verification). When that happens the DeeplinkContext AppState listener
   * has already drained an empty `pendingBackgroundPress` and won't fire
   * again — leaving the press stashed forever and the app on a blank screen.
   *
   * With this callback the background handler can drain the press itself
   * the moment it stashes, as long as the React tree is mounted and the
   * app is already active. `consumePendingBackgroundPress` is idempotent
   * so the original AppState listener path stays safe as a fallback for
   * the opposite race (stash before AppState 'active').
   */
  private onPendingBackgroundPressArrived:
    | HandleNotificationCallback
    | undefined

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
   * Background events run as a headless JS task. This handler intentionally
   * does the minimum amount of work that is safe in that headless context:
   *
   *  - decrement the badge count by one (mirroring the foreground PRESS
   *    handler so a tap clears its badge on every platform / app state), then
   *  - cancel the matching trigger notification (idempotent native call), and
   *  - stash the notification data into {@link pendingBackgroundPress}.
   *
   * Analytics capture is deliberately NOT performed here. The same PRESS is
   * surfaced to the React-mounted context through one of two paths, which
   * handle capture there (with both PostHog and the redux store guaranteed
   * to be initialized):
   *
   *  - warm-background tap: AppState 'active' transition in DeeplinkContext
   *    invokes {@link handlePendingBackgroundPress}.
   *  - cold-start tap: notifee.getInitialNotification() returns the same
   *    press inside {@link getInitialNotification}, which captures it as
   *    `isColdStart: true` and then drains the stale pending value via
   *    {@link consumePendingBackgroundPress}.
   *
   * This split eliminates the duplicate-capture bug observed during CP-14006
   * device verification (cold-start press emitting both `isColdStart: false`
   * and `isColdStart: true`) without any state flag.
   */
  registerBackgroundNotificationHandler = (): void => {
    if (this.backgroundHandlerRegistered) {
      Logger.warn(
        '[NotificationsService.ts][registerBackgroundNotificationHandler] handler already registered; ignoring duplicate call'
      )
      return
    }
    this.backgroundHandlerRegistered = true

    notifee.onBackgroundEvent(async ({ type, detail }) => {
      // eslint-disable-next-line no-console
      console.error(
        `[BLANK-DEBUG] onBackgroundEvent fired type=${type} hasUrl=${
          typeof (detail?.notification?.data as NotificationData | undefined)
            ?.url === 'string'
        } appState=${AppState.currentState}`
      )
      // Wrap the entire body so a synchronous throw doesn't escape the
      // headless task as an unhandled rejection.
      try {
        if (type !== EventType.PRESS) return
        await this.handleBackgroundPress(detail)
      } catch (reason) {
        Logger.error(
          `[NotificationsService.ts][registerBackgroundNotificationHandler]${reason}`
        )
      }
    })
  }

  /**
   * Body of the notifee background PRESS handler, extracted to keep the
   * registration callback simple.
   *
   * Stashes the press synchronously before any await (see CP-14006 device
   * verification — Android release builds were observed firing
   * AppState='active' BEFORE the headless callback by up to ~770 ms, so a
   * slow stash would leave the press unhandled forever). When the app is
   * already active by the time we land here, drains directly through the
   * React-mounted callback because the DeeplinkContext AppState listener
   * has already missed its edge. Side effects (badge decrement, trigger
   * cancellation) run after the stash so they can never delay it.
   */
  private handleBackgroundPress = async (
    detail: EventDetail | undefined
  ): Promise<void> => {
    const data = detail?.notification?.data as NotificationData | undefined
    this.stashAndMaybeDrainBackgroundPress(data)

    // BLANK-DEBUG: temporarily disable badge decrement + trigger
    // cancellation so the headless onBackgroundEvent task returns
    // immediately after the synchronous stash. If the Android warm-
    // background blank screen disappears with this, the long-running
    // async body of this headless task is the root cause — we'll then
    // move these side effects out of the headless task (e.g. into the
    // React-mounted callback) for the production fix.
    // await this.decrementBadgeCount(1)
    // if (detail?.notification?.id) {
    //   await this.cancelTriggerNotification(detail.notification.id)
    // }
    // eslint-disable-next-line no-console
    console.error(
      `[BLANK-DEBUG] handleBackgroundPress skipped post-stash side effects for diagnostic`
    )
  }

  private stashAndMaybeDrainBackgroundPress = (
    data: NotificationData | undefined
  ): void => {
    if (typeof data?.url !== 'string') {
      // eslint-disable-next-line no-console
      console.error(
        `[BLANK-DEBUG] onBackgroundEvent NOT stashing — no url in data=${JSON.stringify(
          data
        )}`
      )
      return
    }

    this.pendingBackgroundPress = data
    // eslint-disable-next-line no-console
    console.error(
      `[BLANK-DEBUG] onBackgroundEvent stashed pendingBackgroundPress url=${data.url}`
    )

    if (AppState.currentState !== 'active') return

    const cb = this.onPendingBackgroundPressArrived
    // eslint-disable-next-line no-console
    console.error(
      `[BLANK-DEBUG] onBackgroundEvent draining itself (already active) hasCallback=${!!cb}`
    )
    if (cb) this.handlePendingBackgroundPress(cb)
  }

  /**
   * Lets the React-mounted DeeplinkContext register a callback that the
   * background event handler can invoke directly when it stashes a press
   * while the app is already active. See {@link onPendingBackgroundPressArrived}
   * for why this is necessary.
   *
   * Pass `undefined` to unregister on unmount.
   */
  setOnPendingBackgroundPressArrived = (
    callback: HandleNotificationCallback | undefined
  ): void => {
    this.onPendingBackgroundPressArrived = callback
  }

  /**
   * Drains the most recent background PRESS data (if any) without side
   * effects. Intended for stale-cleanup paths such as
   * {@link getInitialNotification} on cold start, where the same press has
   * already been captured as `isColdStart: true` and we just need to
   * prevent the AppState listener from replaying it later.
   */
  consumePendingBackgroundPress = (): NotificationData | undefined => {
    const data = this.pendingBackgroundPress
    this.pendingBackgroundPress = undefined
    return data
  }

  /**
   * Warm-background press handler. Drains {@link pendingBackgroundPress},
   * captures `PushNotificationPressed` (isColdStart: false, handler:
   * 'notifee'), and forwards the data to the provided callback for deeplink
   * processing. No-op if nothing is pending.
   *
   * Intended to be called from an AppState 'active' transition in
   * DeeplinkContext — that is the only point where we know the React tree
   * is mounted and PostHog / redux are configured.
   */
  handlePendingBackgroundPress = (
    callback: HandleNotificationCallback
  ): void => {
    const data = this.consumePendingBackgroundPress()
    // eslint-disable-next-line no-console
    console.error(
      `[BLANK-DEBUG] handlePendingBackgroundPress drained data=${JSON.stringify(
        data
      )}`
    )
    if (typeof data?.url !== 'string') {
      // eslint-disable-next-line no-console
      console.error(
        `[BLANK-DEBUG] handlePendingBackgroundPress NO URL, returning early`
      )
      return
    }

    const channelId = resolveChannelId({ data })
    AnalyticsService.capture('PushNotificationPressed', {
      channelId,
      deeplinkUrl: data.url,
      isColdStart: false,
      handler: 'notifee'
    })

    // eslint-disable-next-line no-console
    console.error(
      `[BLANK-DEBUG] handlePendingBackgroundPress invoking callback url=${data.url}`
    )
    callback(data)
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

    const data = detail?.notification?.data as NotificationData | undefined
    // Match the historical "URL or skip" volume: only capture
    // `PushNotificationPressed` when the press has an actionable deeplink.
    // Presses with no URL (e.g. notifications fired without an action) would
    // otherwise inflate the foreground metric and ship `deeplinkUrl: undefined`
    // to PostHog.
    if (typeof data?.url === 'string') {
      const channelId = resolveChannelId({
        androidChannelId: detail?.notification?.android?.channelId,
        data
      })
      // Foreground PRESS is delivered through `notifee.onForegroundEvent` on
      // BOTH platforms (notifee wraps the APNs alert path on iOS), so the
      // handler is always `'notifee'` here regardless of `Platform.OS`.
      //
      // Note: on iOS this event also fires for warm-background presses on
      // notifee-displayed notifications (e.g. tapping a banner that was
      // delivered while the app was in foreground and then backgrounded).
      // That's why we deliberately don't emit a foreground/background flag
      // here — see the `isColdStart` doc on `PushNotificationPressed`.
      AnalyticsService.capture('PushNotificationPressed', {
        channelId,
        deeplinkUrl: data.url,
        isColdStart: false,
        handler: 'notifee'
      })
    }

    callback(data)
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
    let handledColdStart = false
    try {
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

      // Prefer notifee: notifee actually displayed the notification on the
      // data-only Android path, so its data is the source of truth. The
      // legacy `notification` payload (FCM-displayed) is also being phased
      // out on the backend.
      const notifeeData = notifeeInitial?.notification?.data as
        | NotificationData
        | undefined

      if (typeof notifeeData?.url === 'string') {
        const channelId = resolveChannelId({
          androidChannelId: notifeeInitial?.notification?.android?.channelId,
          data: notifeeData
        })
        AnalyticsService.capture('PushNotificationPressed', {
          channelId,
          deeplinkUrl: notifeeData.url,
          isColdStart: true,
          handler: 'notifee'
        })
        callback(notifeeData)
        handledColdStart = true
        return
      }

      const fcmData = fcmInitial?.data as NotificationData | undefined
      // The FCM cold-start path delivers the raw backend SNS payload (the
      // notifee path is already normalized in FCMService.#extractDeepLinkData,
      // which is why we only need the fallback here). NEWS notifications can
      // arrive with only `urlV2` populated — accept either to avoid dropping
      // legacy-iOS NEWS cold-start presses. DeeplinkContext already resolves
      // `urlV2 ?? url` when routing the deeplink, so forwarding `fcmData`
      // as-is keeps the downstream contract intact.
      // TODO: remove `urlV2` fallback after backend is updated to send `url`
      // for NEWS notifications.
      const fcmDeeplinkUrl =
        typeof fcmData?.url === 'string'
          ? fcmData.url
          : typeof fcmData?.urlV2 === 'string'
          ? fcmData.urlV2
          : undefined

      if (fcmDeeplinkUrl !== undefined) {
        const channelId = resolveChannelId({ data: fcmData })
        AnalyticsService.capture('PushNotificationPressed', {
          channelId,
          deeplinkUrl: fcmDeeplinkUrl,
          isColdStart: true,
          handler: 'fcm'
        })
        callback(fcmData)
        handledColdStart = true
        return
      }

      callback(undefined)
    } finally {
      // On cold start the notifee headless background handler also stashes
      // the same press into `pendingBackgroundPress`. If we just handled it
      // here, drain it — otherwise the next AppState 'active' transition
      // would re-fire the same deeplink via the listener in DeeplinkContext.
      //
      // We deliberately do NOT drain when no cold-start press was found:
      // the effect that calls this method re-runs on
      // `isAllNotificationsBlocked` toggles, and a legitimate warm-background
      // press can already be sitting in `pendingBackgroundPress` waiting for
      // the AppState listener to consume it.
      if (handledColdStart) {
        this.consumePendingBackgroundPress()
      }
    }
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

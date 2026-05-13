import notifee, { EventDetail, EventType } from '@notifee/react-native'
import messaging from '@react-native-firebase/messaging'
import AnalyticsService from 'services/analytics/AnalyticsService'
import Logger from 'utils/Logger'
import { ChannelId, DEFAULT_ANDROID_CHANNEL } from './channels'
import NotificationsService from './NotificationsService'

// Helper for poking at the singleton's private state in tests. The class is
// exported as a singleton so we cannot instantiate a fresh one per test —
// reset the guard fields directly so each test starts from a known state.
const resetBackgroundHandlerState = (): void => {
  ;(
    NotificationsService as unknown as { backgroundHandlerRegistered: boolean }
  ).backgroundHandlerRegistered = false
}

const setPendingBackgroundPress = (
  value: Record<string, unknown> | undefined
): void => {
  ;(
    NotificationsService as unknown as {
      pendingBackgroundPress: Record<string, unknown> | undefined
    }
  ).pendingBackgroundPress = value
}

// Override the messaging mock from tests/jestSetup/firebase.js so its default
// export is a jest.fn(), allowing per-test control of getInitialNotification.
jest.mock('@react-native-firebase/messaging', () =>
  jest.fn(() => ({
    deleteToken: jest.fn(() => ({ token: 'fcmToken' })),
    getInitialNotification: jest.fn().mockResolvedValue(null)
  }))
)

describe('scheduleNotification', () => {
  it('should have scheduled notification', async () => {
    const mockNotification = {
      txHash: 'testNodeId',
      timestamp: 123456789,
      channelId: ChannelId.STAKING_COMPLETE,
      accountId: '3824cbfb-6016-4731-a1dd-8e3a2b202d6f'
    }
    await NotificationsService.scheduleNotification(mockNotification)
    expect(notifee.createTriggerNotification).toHaveBeenCalled()
  })
  it('should not have scheduled notification without correct channelId', async () => {
    const mockNotification = {
      txHash: 'testNodeId',
      timestamp: 123456789,
      channelId: 'testChannelId' as ChannelId,
      accountId: '3824cbfb-6016-4731-a1dd-8e3a2b202d6f'
    }
    await NotificationsService.scheduleNotification(mockNotification)
    expect(notifee.createTriggerNotification).not.toHaveBeenCalled()
  })
})

describe('getNotificationTriggerById', () => {
  jest
    .spyOn(notifee, 'getTriggerNotifications')
    // @ts-ignore
    .mockReturnValue([{ notification: { id: 'testNodeId' } }])
  it('should return notification trigger by Id', async () => {
    const result = await NotificationsService.getNotificationTriggerById(
      'testNodeId'
    )
    expect(result).toEqual({ notification: { id: 'testNodeId' } })
  })
  it('should return undefined with no input param', async () => {
    const result = await NotificationsService.getNotificationTriggerById()
    expect(result).toBe(undefined)
  })
  it('should return undefined with no matching id', async () => {
    const result = await NotificationsService.getNotificationTriggerById('test')
    expect(result).toBe(undefined)
  })
})

describe('update badge count', () => {
  beforeEach(() => {
    notifee.setBadgeCount(0)
  })
  it('should increment badge count', async () => {
    await NotificationsService.incrementBadgeCount()
    const result = await notifee.getBadgeCount()
    expect(result).toEqual(1)
  })
  it('should decrement badge count', async () => {
    await NotificationsService.incrementBadgeCount()
    await NotificationsService.incrementBadgeCount()

    await NotificationsService.decrementBadgeCount()
    const result = await notifee.getBadgeCount()
    expect(result).toEqual(1)
  })
  it('should set badge count to 1', async () => {
    await NotificationsService.setBadgeCount(1)
    const result = await notifee.getBadgeCount()
    expect(result).toEqual(1)
  })
})

describe('handleNotificationPress', () => {
  const mockCallback = jest.fn()
  const mockCancelTriggerNotification = jest.fn()
  jest
    .spyOn(NotificationsService, 'cancelTriggerNotification')
    .mockImplementation(mockCancelTriggerNotification)

  beforeEach(() => {
    mockCallback.mockClear()
    mockCancelTriggerNotification.mockClear()
    jest.spyOn(AnalyticsService, 'capture').mockResolvedValue(undefined)
  })

  it('should have called mockCallback and mockCancelTriggerNotification', async () => {
    const mockDetail = {
      notification: {
        id: 'testNodeId',
        data: {
          url: 'testUrl'
        }
      }
    }
    await NotificationsService.handleNotificationPress({
      detail: mockDetail,
      callback: mockCallback
    })
    expect(mockCancelTriggerNotification).toHaveBeenCalled()
    expect(mockCallback).toHaveBeenCalled()
  })

  it('does not capture PushNotificationPressed when the foreground PRESS has no deeplink url, but still routes the callback', async () => {
    const mockDetail = {
      notification: {
        id: 'testNodeId',
        data: { event: 'PRODUCT_ANNOUNCEMENTS' }
      }
    }
    await NotificationsService.handleNotificationPress({
      detail: mockDetail,
      callback: mockCallback
    })
    expect(AnalyticsService.capture).not.toHaveBeenCalled()
    expect(mockCallback).toHaveBeenCalledWith(mockDetail.notification.data)
  })

  it('captures PushNotificationPressed (isColdStart=false, handler=notifee) when the foreground PRESS has a deeplink url', async () => {
    const mockDetail = {
      notification: {
        id: 'testNodeId',
        data: { url: 'core://portfolio', event: 'PRODUCT_ANNOUNCEMENTS' },
        android: { channelId: ChannelId.PRODUCT_ANNOUNCEMENTS }
      }
    }
    await NotificationsService.handleNotificationPress({
      detail: mockDetail,
      callback: mockCallback
    })
    expect(AnalyticsService.capture).toHaveBeenCalledWith(
      'PushNotificationPressed',
      {
        channelId: ChannelId.PRODUCT_ANNOUNCEMENTS,
        deeplinkUrl: 'core://portfolio',
        isColdStart: false,
        handler: 'notifee'
      }
    )
  })
})

describe('handleNotificationEvent', () => {
  const mockDetail = {
    notification: {
      id: 'testNodeId',
      data: {
        url: 'testUrl'
      }
    }
  }

  const mockIncrementBadgeCount = jest.fn()
  const mockHandleNotificationPress = jest.fn()

  beforeEach(() => {
    jest
      .spyOn(NotificationsService, 'incrementBadgeCount')
      .mockImplementation(mockIncrementBadgeCount)
    jest
      .spyOn(NotificationsService, 'handleNotificationPress')
      .mockImplementation(mockHandleNotificationPress)
  })
  it('should have called mockIncrementBadgeCount', async () => {
    await NotificationsService.handleNotificationEvent({
      type: EventType.DELIVERED,
      detail: mockDetail,
      callback: jest.fn()
    })
    expect(mockIncrementBadgeCount).toHaveBeenCalled()
  })
  it('should not have called mockHandleNotificationPress', async () => {
    await NotificationsService.handleNotificationEvent({
      type: EventType.PRESS,
      detail: mockDetail,
      callback: jest.fn()
    })
    expect(mockHandleNotificationPress).toHaveBeenCalled()
  })
  it('should not have called mockCancelTriggerNotification and mockCallback', async () => {
    const invalidParams = {
      notification: { test: 'test' }
    }
    await NotificationsService.handleNotificationEvent({
      type: EventType.DISMISSED,
      detail: invalidParams as EventDetail,
      callback: jest.fn()
    })
    expect(mockIncrementBadgeCount).not.toHaveBeenCalled()
    expect(mockHandleNotificationPress).not.toHaveBeenCalled()
  })
})

describe('getInitialNotification', () => {
  const callback = jest.fn()
  const buildNotifeeInitial = (
    data: Record<string, unknown> | undefined,
    androidChannelId?: string
  ): unknown => ({
    notification: {
      data,
      android: androidChannelId ? { channelId: androidChannelId } : undefined
    },
    pressAction: { id: 'default' }
  })

  const setFcmInitial = (value: unknown): void => {
    ;(messaging as unknown as jest.Mock).mockReturnValue({
      getInitialNotification: jest.fn().mockResolvedValue(value)
    })
  }

  const setNotifeeInitial = (value: unknown): void => {
    ;(notifee.getInitialNotification as jest.Mock).mockResolvedValue(value)
  }

  beforeEach(() => {
    jest.spyOn(AnalyticsService, 'capture').mockResolvedValue(undefined)
    setNotifeeInitial(null)
    setFcmInitial(null)
    setPendingBackgroundPress(undefined)
  })

  it('captures press from notifee initial notification (Android data-only cold start)', async () => {
    const data = {
      url: 'core://portfolio',
      event: 'PRODUCT_ANNOUNCEMENTS',
      channelId: ChannelId.PRODUCT_ANNOUNCEMENTS,
      title: 'New product',
      body: 'Check it out'
    }
    setNotifeeInitial(
      buildNotifeeInitial(data, ChannelId.PRODUCT_ANNOUNCEMENTS)
    )

    await NotificationsService.getInitialNotification(callback)

    expect(AnalyticsService.capture).toHaveBeenCalledTimes(1)
    expect(AnalyticsService.capture).toHaveBeenCalledWith(
      'PushNotificationPressed',
      {
        channelId: ChannelId.PRODUCT_ANNOUNCEMENTS,
        deeplinkUrl: 'core://portfolio',
        isColdStart: true,
        handler: 'notifee'
      }
    )
    expect(callback).toHaveBeenCalledWith(data)
  })

  it('classifies a BALANCE_CHANGES notifee cold-start press as the BALANCE_CHANGES channel (not miscellaneous)', async () => {
    // Regression: this case was observed during CP-14006 device verification.
    // BALANCE_CHANGES notifications retrieved via `notifee.getInitialNotification`
    // were falling through to DEFAULT_ANDROID_CHANNEL because the notifee
    // data payload was missing both `channelId` and `event`. The fix stamps
    // both fields in `FCMService.#extractDeepLinkData` so this test asserts
    // the resolved channel travels end-to-end.
    const data = {
      url: 'core://portfolio',
      event: 'BALANCES_RECEIVED',
      channelId: ChannelId.BALANCE_CHANGES,
      accountAddress: '0xabc',
      chainId: '43114',
      transactionHash: '0xdeadbeef'
    }
    // iOS notifee notifications have no `android.channelId` — pass undefined
    // to exercise the `data.channelId` precedence in `resolveChannelId`.
    setNotifeeInitial(buildNotifeeInitial(data, undefined))

    await NotificationsService.getInitialNotification(callback)

    expect(AnalyticsService.capture).toHaveBeenCalledWith(
      'PushNotificationPressed',
      {
        channelId: ChannelId.BALANCE_CHANGES,
        deeplinkUrl: 'core://portfolio',
        isColdStart: true,
        handler: 'notifee'
      }
    )
  })

  it('captures press from FCM initial notification when notifee initial is null (legacy notification payload path)', async () => {
    const data = {
      url: 'core://portfolio',
      event: 'PRODUCT_ANNOUNCEMENTS'
    }
    setFcmInitial({ data })

    await NotificationsService.getInitialNotification(callback)

    expect(AnalyticsService.capture).toHaveBeenCalledTimes(1)
    expect(AnalyticsService.capture).toHaveBeenCalledWith(
      'PushNotificationPressed',
      {
        channelId: ChannelId.PRODUCT_ANNOUNCEMENTS,
        deeplinkUrl: 'core://portfolio',
        isColdStart: true,
        handler: 'fcm'
      }
    )
    expect(callback).toHaveBeenCalledWith(data)
  })

  it('falls back to urlV2 when the FCM initial notification only has urlV2 (legacy iOS NEWS payload)', async () => {
    // NEWS notifications can arrive with only `urlV2`; the FCM cold-start
    // path receives the raw backend SNS payload (notifee path is normalized
    // upstream), so without this fallback we silently drop NEWS cold-start
    // presses on the legacy iOS APNs alert route.
    const data = {
      urlV2: 'core://watchlist',
      event: 'PRICE_ALERTS'
    }
    setFcmInitial({ data })

    await NotificationsService.getInitialNotification(callback)

    expect(AnalyticsService.capture).toHaveBeenCalledTimes(1)
    expect(AnalyticsService.capture).toHaveBeenCalledWith(
      'PushNotificationPressed',
      {
        channelId: ChannelId.PRICE_ALERTS,
        deeplinkUrl: 'core://watchlist',
        isColdStart: true,
        handler: 'fcm'
      }
    )
    expect(callback).toHaveBeenCalledWith(data)
  })

  it('prefers url over urlV2 in the FCM initial notification payload', async () => {
    const data = {
      url: 'core://portfolio',
      urlV2: 'core://watchlist',
      event: 'PRICE_ALERTS'
    }
    setFcmInitial({ data })

    await NotificationsService.getInitialNotification(callback)

    expect(AnalyticsService.capture).toHaveBeenCalledWith(
      'PushNotificationPressed',
      {
        channelId: ChannelId.PRICE_ALERTS,
        deeplinkUrl: 'core://portfolio',
        isColdStart: true,
        handler: 'fcm'
      }
    )
  })

  it('does not capture and invokes callback with undefined when no initial notification is present in either source', async () => {
    await NotificationsService.getInitialNotification(callback)

    expect(AnalyticsService.capture).not.toHaveBeenCalled()
    expect(callback).toHaveBeenCalledWith(undefined)
  })

  it('does not capture when notifee initial notification lacks a deeplink url', async () => {
    setNotifeeInitial(
      buildNotifeeInitial(
        { event: 'PRODUCT_ANNOUNCEMENTS' },
        ChannelId.PRODUCT_ANNOUNCEMENTS
      )
    )

    await NotificationsService.getInitialNotification(callback)

    expect(AnalyticsService.capture).not.toHaveBeenCalled()
    expect(callback).toHaveBeenCalledWith(undefined)
  })

  it('prefers notifee initial notification over FCM when both are present', async () => {
    const notifeeData = {
      url: 'core://portfolio',
      event: 'PRODUCT_ANNOUNCEMENTS'
    }
    const fcmData = { url: 'core://watchlist', event: 'PRICE_ALERTS' }
    setNotifeeInitial(
      buildNotifeeInitial(notifeeData, ChannelId.PRODUCT_ANNOUNCEMENTS)
    )
    setFcmInitial({ data: fcmData })

    await NotificationsService.getInitialNotification(callback)

    expect(AnalyticsService.capture).toHaveBeenCalledTimes(1)
    expect(AnalyticsService.capture).toHaveBeenCalledWith(
      'PushNotificationPressed',
      {
        channelId: ChannelId.PRODUCT_ANNOUNCEMENTS,
        deeplinkUrl: 'core://portfolio',
        isColdStart: true,
        handler: 'notifee'
      }
    )
    expect(callback).toHaveBeenCalledWith(notifeeData)
  })

  it('falls back to EVENT_TO_CH_ID mapping when no android.channelId is set on the notifee notification', async () => {
    const data = { url: 'core://watchlist', event: 'PRICE_ALERTS' }
    setNotifeeInitial(buildNotifeeInitial(data, undefined))

    await NotificationsService.getInitialNotification(callback)

    expect(AnalyticsService.capture).toHaveBeenCalledWith(
      'PushNotificationPressed',
      {
        channelId: ChannelId.PRICE_ALERTS,
        deeplinkUrl: 'core://watchlist',
        isColdStart: true,
        handler: 'notifee'
      }
    )
  })

  it('falls back to DEFAULT_ANDROID_CHANNEL when no channel info is available at all', async () => {
    const data = { url: 'core://portfolio' }
    setNotifeeInitial(buildNotifeeInitial(data, undefined))

    await NotificationsService.getInitialNotification(callback)

    expect(AnalyticsService.capture).toHaveBeenCalledWith(
      'PushNotificationPressed',
      {
        channelId: DEFAULT_ANDROID_CHANNEL,
        deeplinkUrl: 'core://portfolio',
        isColdStart: true,
        handler: 'notifee'
      }
    )
  })

  it('still falls back to FCM when notifee.getInitialNotification rejects', async () => {
    ;(notifee.getInitialNotification as jest.Mock).mockRejectedValue(
      new Error('notifee boom')
    )
    const fcmData = { url: 'core://portfolio', event: 'PRODUCT_ANNOUNCEMENTS' }
    setFcmInitial({ data: fcmData })

    await NotificationsService.getInitialNotification(callback)

    expect(AnalyticsService.capture).toHaveBeenCalledWith(
      'PushNotificationPressed',
      {
        channelId: ChannelId.PRODUCT_ANNOUNCEMENTS,
        deeplinkUrl: 'core://portfolio',
        isColdStart: true,
        handler: 'fcm'
      }
    )
    expect(callback).toHaveBeenCalledWith(fcmData)
  })

  it('drains pendingBackgroundPress after handling a cold-start notifee press so the AppState active listener does not re-fire it', async () => {
    // Simulate the notifee headless background handler having stashed the
    // same press during cold start before React mounted.
    setPendingBackgroundPress({ url: 'core://portfolio' })
    setNotifeeInitial(
      buildNotifeeInitial(
        { url: 'core://portfolio' },
        ChannelId.PRODUCT_ANNOUNCEMENTS
      )
    )

    await NotificationsService.getInitialNotification(callback)

    expect(NotificationsService.consumePendingBackgroundPress()).toBeUndefined()
  })

  it('also drains pendingBackgroundPress when handling a cold-start FCM press', async () => {
    setPendingBackgroundPress({ url: 'core://stale' })
    setFcmInitial({
      data: { url: 'core://portfolio', event: 'PRODUCT_ANNOUNCEMENTS' }
    })

    await NotificationsService.getInitialNotification(callback)

    expect(NotificationsService.consumePendingBackgroundPress()).toBeUndefined()
  })

  it('preserves pendingBackgroundPress when no cold-start notification is found, so a pending warm-background press can still be consumed by the AppState listener', async () => {
    // Re-invocation path: if the `getInitialNotification` effect re-runs
    // (e.g. on `isAllNotificationsBlocked` flag toggle) while a warm-
    // background press is sitting in pending, we must NOT drain it — the
    // DeeplinkContext AppState 'active' listener owns that press.
    const pending = { url: 'core://portfolio', event: 'PRODUCT_ANNOUNCEMENTS' }
    setPendingBackgroundPress(pending)

    await NotificationsService.getInitialNotification(callback)

    expect(AnalyticsService.capture).not.toHaveBeenCalled()
    expect(callback).toHaveBeenCalledWith(undefined)
    expect(NotificationsService.consumePendingBackgroundPress()).toEqual(
      pending
    )
  })
})

describe('registerBackgroundNotificationHandler', () => {
  const getHandler = (): ((event: unknown) => Promise<void>) => {
    const handler = (notifee.onBackgroundEvent as jest.Mock).mock.calls.at(
      -1
    )?.[0]
    expect(handler).toBeDefined()
    return handler as (event: unknown) => Promise<void>
  }

  beforeEach(() => {
    jest.spyOn(AnalyticsService, 'capture').mockResolvedValue(undefined)
    // Reset the singleton's idempotence guard and clear the notifee mock so
    // each test exercises a fresh registration. Also drain any pending press
    // leftover from a previous test.
    resetBackgroundHandlerState()
    ;(notifee.onBackgroundEvent as jest.Mock).mockClear()
    NotificationsService.consumePendingBackgroundPress()
  })

  it('registers a notifee.onBackgroundEvent handler exactly once per call', () => {
    NotificationsService.registerBackgroundNotificationHandler()

    expect(notifee.onBackgroundEvent).toHaveBeenCalledTimes(1)
  })

  it('logs a warning and skips re-registration on duplicate calls (notifee only supports one handler)', () => {
    const warnSpy = jest.spyOn(Logger, 'warn').mockImplementation()

    NotificationsService.registerBackgroundNotificationHandler()
    NotificationsService.registerBackgroundNotificationHandler()
    NotificationsService.registerBackgroundNotificationHandler()

    expect(notifee.onBackgroundEvent).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledTimes(2)
  })

  it('cancels the trigger notification on PRESS events', async () => {
    const cancelSpy = jest
      .spyOn(NotificationsService, 'cancelTriggerNotification')
      .mockResolvedValue(undefined)

    NotificationsService.registerBackgroundNotificationHandler()

    await getHandler()({
      type: EventType.PRESS,
      detail: { notification: { id: 'noti-1' } }
    })

    expect(cancelSpy).toHaveBeenCalledWith('noti-1')
  })

  it('decrements the badge count on PRESS events (mirrors the foreground handler)', async () => {
    // The foreground handler decrements on PRESS; without the matching
    // decrement here a warm-background tap (or any cold-start tap) would
    // leave the badge inflated even after the user read the notification.
    NotificationsService.registerBackgroundNotificationHandler()

    await getHandler()({
      type: EventType.PRESS,
      detail: { notification: { id: 'noti-badge' } }
    })

    expect(notifee.decrementBadgeCount).toHaveBeenCalledWith(1)
  })

  it('ignores non-PRESS background events (e.g. DELIVERED)', async () => {
    const cancelSpy = jest
      .spyOn(NotificationsService, 'cancelTriggerNotification')
      .mockResolvedValue(undefined)

    NotificationsService.registerBackgroundNotificationHandler()

    await getHandler()({
      type: EventType.DELIVERED,
      detail: { notification: { id: 'noti-2' } }
    })

    expect(cancelSpy).not.toHaveBeenCalled()
    expect(notifee.decrementBadgeCount).not.toHaveBeenCalled()
    expect(AnalyticsService.capture).not.toHaveBeenCalled()
  })

  it('does NOT capture analytics from the headless background handler (capture is deferred to React-mounted context)', async () => {
    // The notifee background event runs as a headless JS task. Capture is
    // deliberately deferred to handlePendingBackgroundPress (warm-background)
    // or getInitialNotification (cold-start), both of which run with PostHog
    // / redux fully initialized. This avoids the duplicate-capture observed
    // during CP-14006 device verification (one 'background' + one
    // 'cold_start' for the same cold-start tap).
    NotificationsService.registerBackgroundNotificationHandler()

    await getHandler()({
      type: EventType.PRESS,
      detail: {
        notification: {
          id: 'noti-press',
          data: { url: 'core://portfolio', event: 'PRODUCT_ANNOUNCEMENTS' },
          android: { channelId: ChannelId.PRODUCT_ANNOUNCEMENTS }
        }
      }
    })

    expect(AnalyticsService.capture).not.toHaveBeenCalled()
  })

  it('stashes the notification data so it can be consumed by the React-mounted context', async () => {
    NotificationsService.registerBackgroundNotificationHandler()

    const data = { url: 'core://portfolio', event: 'PRODUCT_ANNOUNCEMENTS' }
    await getHandler()({
      type: EventType.PRESS,
      detail: {
        notification: {
          id: 'noti-pending',
          data,
          android: { channelId: ChannelId.PRODUCT_ANNOUNCEMENTS }
        }
      }
    })

    expect(NotificationsService.consumePendingBackgroundPress()).toEqual(data)
    // consume is one-shot
    expect(NotificationsService.consumePendingBackgroundPress()).toBeUndefined()
  })

  it('does not stash when the PRESS notification has no deeplink url', async () => {
    NotificationsService.registerBackgroundNotificationHandler()

    await getHandler()({
      type: EventType.PRESS,
      detail: {
        notification: {
          id: 'noti-no-url',
          data: { event: 'PRODUCT_ANNOUNCEMENTS' }
        }
      }
    })

    expect(NotificationsService.consumePendingBackgroundPress()).toBeUndefined()
  })
})

describe('handlePendingBackgroundPress', () => {
  beforeEach(() => {
    jest.spyOn(AnalyticsService, 'capture').mockResolvedValue(undefined)
    NotificationsService.consumePendingBackgroundPress()
  })

  it('captures PushNotificationPressed (isColdStart=false, handler=notifee) and invokes the callback when a press is pending', () => {
    const data = { url: 'core://portfolio', event: 'PRODUCT_ANNOUNCEMENTS' }
    setPendingBackgroundPress(data)
    const callback = jest.fn()

    NotificationsService.handlePendingBackgroundPress(callback)

    expect(AnalyticsService.capture).toHaveBeenCalledWith(
      'PushNotificationPressed',
      {
        channelId: ChannelId.PRODUCT_ANNOUNCEMENTS,
        deeplinkUrl: 'core://portfolio',
        isColdStart: false,
        handler: 'notifee'
      }
    )
    expect(callback).toHaveBeenCalledWith(data)
  })

  it('falls back to DEFAULT_ANDROID_CHANNEL when the pending press has no channelId or event mapping', () => {
    setPendingBackgroundPress({ url: 'core://portfolio' })
    const callback = jest.fn()

    NotificationsService.handlePendingBackgroundPress(callback)

    expect(AnalyticsService.capture).toHaveBeenCalledWith(
      'PushNotificationPressed',
      {
        channelId: DEFAULT_ANDROID_CHANNEL,
        deeplinkUrl: 'core://portfolio',
        isColdStart: false,
        handler: 'notifee'
      }
    )
  })

  it('is a no-op when no press is pending', () => {
    const callback = jest.fn()

    NotificationsService.handlePendingBackgroundPress(callback)

    expect(AnalyticsService.capture).not.toHaveBeenCalled()
    expect(callback).not.toHaveBeenCalled()
  })

  it('drains the pending press after handling so subsequent calls are no-ops', () => {
    setPendingBackgroundPress({ url: 'core://portfolio' })
    const callback = jest.fn()

    NotificationsService.handlePendingBackgroundPress(callback)
    NotificationsService.handlePendingBackgroundPress(callback)

    expect(AnalyticsService.capture).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledTimes(1)
  })
})

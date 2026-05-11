import notifee, { EventDetail, EventType } from '@notifee/react-native'
import messaging from '@react-native-firebase/messaging'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { ChannelId, DEFAULT_ANDROID_CHANNEL } from './channels'
import NotificationsService from './NotificationsService'

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
        source: 'notifee_initial'
      }
    )
    expect(callback).toHaveBeenCalledWith(data)
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
        source: 'fcm_initial'
      }
    )
    expect(callback).toHaveBeenCalledWith(data)
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
        source: 'notifee_initial'
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
        source: 'notifee_initial'
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
        source: 'notifee_initial'
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
        source: 'fcm_initial'
      }
    )
    expect(callback).toHaveBeenCalledWith(fcmData)
  })
})

describe('registerBackgroundNotificationHandler', () => {
  it('registers a notifee.onBackgroundEvent handler exactly once per call', () => {
    NotificationsService.registerBackgroundNotificationHandler()

    expect(notifee.onBackgroundEvent).toHaveBeenCalledTimes(1)
  })

  it('cancels the trigger notification on PRESS events', async () => {
    const cancelSpy = jest
      .spyOn(NotificationsService, 'cancelTriggerNotification')
      .mockResolvedValue(undefined)

    NotificationsService.registerBackgroundNotificationHandler()

    const handler = (notifee.onBackgroundEvent as jest.Mock).mock.calls.at(
      -1
    )?.[0]
    expect(handler).toBeDefined()

    await handler({
      type: EventType.PRESS,
      detail: { notification: { id: 'noti-1' } }
    })

    expect(cancelSpy).toHaveBeenCalledWith('noti-1')
  })

  it('ignores non-PRESS background events (e.g. DELIVERED)', async () => {
    const cancelSpy = jest
      .spyOn(NotificationsService, 'cancelTriggerNotification')
      .mockResolvedValue(undefined)

    NotificationsService.registerBackgroundNotificationHandler()

    const handler = (notifee.onBackgroundEvent as jest.Mock).mock.calls.at(
      -1
    )?.[0]

    await handler({
      type: EventType.DELIVERED,
      detail: { notification: { id: 'noti-2' } }
    })

    expect(cancelSpy).not.toHaveBeenCalled()
  })

  it('does not capture analytics from the headless background event (PostHog is not configured yet on cold start)', async () => {
    jest.spyOn(AnalyticsService, 'capture').mockResolvedValue(undefined)

    NotificationsService.registerBackgroundNotificationHandler()

    const handler = (notifee.onBackgroundEvent as jest.Mock).mock.calls.at(
      -1
    )?.[0]

    await handler({
      type: EventType.PRESS,
      detail: { notification: { id: 'noti-3', data: { url: 'core://x' } } }
    })

    expect(AnalyticsService.capture).not.toHaveBeenCalled()
  })
})

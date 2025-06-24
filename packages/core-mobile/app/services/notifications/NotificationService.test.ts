import notifee, { EventDetail, EventType } from '@notifee/react-native'
import { ChannelId } from './channels'
import NotificationsService from './NotificationsService'

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

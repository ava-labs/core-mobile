import { selectAccounts } from 'store/account'
import { registerDeviceToNotificationSender } from 'services/notifications/registerDeviceToNotificationSender'
import FCMService from 'services/fcm/FCMService'
import NotificationsService from 'services/notifications/NotificationsService'
import Logger from 'utils/Logger'
import { ChannelId } from 'services/notifications/channels'
import { AppListenerEffectAPI } from 'store/types'
import { subscribeForNews } from 'services/notifications/news/subscribeForNews'
import {
  selectEnabledNewsNotificationSubscriptions,
  selectNotificationSubscription
} from '../slice'
import { subscribeNewsNotifications } from './subscribeNewsNotifications'
import { unsubscribeNewsNotifications } from './unsubscribeNewsNotifications'

jest.mock('../slice', () => ({
  selectNotificationSubscription: jest.fn(),
  selectEnabledNewsNotificationSubscriptions: jest.fn()
}))

jest.mock('store/account', () => ({
  selectAccounts: jest.fn()
}))

jest.mock('services/notifications/registerDeviceToNotificationSender', () => ({
  registerDeviceToNotificationSender: jest.fn()
}))

jest.mock('services/fcm/FCMService', () => ({
  getFCMToken: jest.fn()
}))

jest.mock('./unsubscribeNewsNotifications', () => ({
  unsubscribeNewsNotifications: jest.fn()
}))

jest.mock('services/notifications/news/subscribeForNews', () => ({
  subscribeForNews: jest.fn()
}))

jest.mock('services/notifications/NotificationsService', () => ({
  getBlockedNewsNotifications: jest.fn()
}))

jest.mock('utils/Logger', () => ({
  error: jest.fn()
}))

const marketNewsMock = jest.fn()
const offersAndPromoMock = jest.fn()
const priceAlertsMock = jest.fn()
const productAnnouncementsMock = jest.fn()

describe('subscribeNewsNotifications', () => {
  let listenerApi: AppListenerEffectAPI

  beforeEach(() => {
    listenerApi = {
      getState: jest.fn()
    } as unknown as AppListenerEffectAPI

    jest.clearAllMocks()
    ;(selectNotificationSubscription as jest.Mock).mockReturnValue(
      (channelId: ChannelId) => {
        if (channelId === ChannelId.MARKET_NEWS) {
          return marketNewsMock
        }
        if (channelId === ChannelId.OFFERS_AND_PROMOTIONS) {
          return offersAndPromoMock
        }
        if (channelId === ChannelId.PRICE_ALERTS) {
          return priceAlertsMock
        }
        if (channelId === ChannelId.PRODUCT_ANNOUNCEMENTS) {
          return productAnnouncementsMock
        }
      }
    )
    ;(selectEnabledNewsNotificationSubscriptions as jest.Mock).mockReturnValue(
      []
    )
  })

  it('should skip subscription if user has not enabled news notifications', async () => {
    ;(selectNotificationSubscription as jest.Mock).mockReturnValue(() => false)

    await subscribeNewsNotifications(listenerApi)

    expect(FCMService.getFCMToken).not.toHaveBeenCalled()
    expect(registerDeviceToNotificationSender).not.toHaveBeenCalled()
    expect(subscribeForNews).not.toHaveBeenCalled()
  })

  it('should unsubscribe blocked news notifications and subscribe enabled notifications', async () => {
    ;(selectEnabledNewsNotificationSubscriptions as jest.Mock).mockReturnValue([
      ChannelId.MARKET_NEWS
    ])
    ;(selectAccounts as jest.Mock).mockReturnValue({
      account1: { addressC: 'address1' }
    })
    ;(FCMService.getFCMToken as jest.Mock).mockResolvedValue('fcmToken')
    ;(registerDeviceToNotificationSender as jest.Mock).mockResolvedValue(
      'deviceArn'
    )
    ;(
      NotificationsService.getBlockedNewsNotifications as jest.Mock
    ).mockResolvedValue({
      [ChannelId.MARKET_NEWS]: true,
      [ChannelId.OFFERS_AND_PROMOTIONS]: false,
      [ChannelId.PRICE_ALERTS]: false,
      [ChannelId.PRODUCT_ANNOUNCEMENTS]: false
    })
    ;(subscribeForNews as jest.Mock).mockResolvedValue({
      message: 'ok'
    })

    await subscribeNewsNotifications(listenerApi)

    expect(unsubscribeNewsNotifications).toHaveBeenCalledWith({
      channelIds: [
        ChannelId.OFFERS_AND_PROMOTIONS,
        ChannelId.PRICE_ALERTS,
        ChannelId.PRODUCT_ANNOUNCEMENTS
      ]
    })
    expect(subscribeForNews).toHaveBeenCalled()
  })

  it('should subscribe for all news notifications if not blocked', async () => {
    ;(selectEnabledNewsNotificationSubscriptions as jest.Mock).mockReturnValue([
      ChannelId.MARKET_NEWS,
      ChannelId.OFFERS_AND_PROMOTIONS,
      ChannelId.PRICE_ALERTS,
      ChannelId.PRODUCT_ANNOUNCEMENTS
    ])
    ;(selectAccounts as jest.Mock).mockReturnValue({
      account1: { addressC: 'address1' }
    })
    ;(FCMService.getFCMToken as jest.Mock).mockResolvedValue('fcmToken')
    ;(registerDeviceToNotificationSender as jest.Mock).mockResolvedValue(
      'deviceArn'
    )
    ;(
      NotificationsService.getBlockedNewsNotifications as jest.Mock
    ).mockResolvedValue(new Set())
    ;(subscribeForNews as jest.Mock).mockResolvedValue({
      message: 'ok'
    })

    await subscribeNewsNotifications(listenerApi)

    expect(unsubscribeNewsNotifications).not.toHaveBeenCalled()
    expect(subscribeForNews).toHaveBeenCalledWith({
      deviceArn: expect.anything(),
      channelIds: [
        ChannelId.MARKET_NEWS,
        ChannelId.OFFERS_AND_PROMOTIONS,
        ChannelId.PRICE_ALERTS,
        ChannelId.PRODUCT_ANNOUNCEMENTS
      ]
    })
  })

  it('should log error and throw if subscription response is not "ok"', async () => {
    ;(selectEnabledNewsNotificationSubscriptions as jest.Mock).mockReturnValue([
      ChannelId.MARKET_NEWS,
      ChannelId.OFFERS_AND_PROMOTIONS,
      ChannelId.PRICE_ALERTS,
      ChannelId.PRODUCT_ANNOUNCEMENTS
    ])
    ;(selectAccounts as jest.Mock).mockReturnValue({
      account1: { addressC: 'address1' }
    })
    ;(FCMService.getFCMToken as jest.Mock).mockResolvedValue('fcmToken')
    ;(registerDeviceToNotificationSender as jest.Mock).mockResolvedValue(
      'deviceArn'
    )
    ;(
      NotificationsService.getBlockedNewsNotifications as jest.Mock
    ).mockResolvedValue(new Set())
    ;(subscribeForNews as jest.Mock).mockResolvedValue({
      message: 'error'
    })

    await expect(subscribeNewsNotifications(listenerApi)).rejects.toThrow(
      'error'
    )

    expect(Logger.error).toHaveBeenCalledWith(
      '[subscribeNewsNotifications.ts][subscribeNewsNotifications]error'
    )
  })

  it('should handle error during device registration and not proceed with subscription', async () => {
    ;(selectEnabledNewsNotificationSubscriptions as jest.Mock).mockReturnValue([
      ChannelId.MARKET_NEWS,
      ChannelId.OFFERS_AND_PROMOTIONS,
      ChannelId.PRICE_ALERTS,
      ChannelId.PRODUCT_ANNOUNCEMENTS
    ])
    ;(selectAccounts as jest.Mock).mockReturnValue({
      account1: { addressC: 'address1' }
    })
    ;(FCMService.getFCMToken as jest.Mock).mockResolvedValue('fcmToken')
    ;(registerDeviceToNotificationSender as jest.Mock).mockRejectedValue(
      new Error('Device registration error')
    )

    await expect(subscribeNewsNotifications(listenerApi)).rejects.toThrow(
      'Device registration error'
    )

    expect(subscribeForNews).not.toHaveBeenCalled()
  })
})

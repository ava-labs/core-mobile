import { selectAccounts } from 'store/account'
import { registerDeviceToNotificationSender } from 'services/notifications/registerDeviceToNotificationSender'
import FCMService from 'services/fcm/FCMService'
import { unSubscribeForBalanceChange } from 'services/notifications/balanceChange/unsubscribeForBalanceChange'
import { subscribeForBalanceChange } from 'services/notifications/balanceChange/subscribeForBalanceChange'
import NotificationsService from 'services/notifications/NotificationsService'
import Logger from 'utils/Logger'
import { ChannelId } from 'services/notifications/channels'
import { ChainId } from '@avalabs/core-chains-sdk'
import { subscribeBalanceChangeNotifications } from 'store/notifications/listeners/subscribeBalanceChangeNotifications'
import { AppListenerEffectAPI } from 'store/types'
import { selectNotificationSubscription } from '../slice'

jest.mock('../slice', () => ({
  selectNotificationSubscription: jest.fn()
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

jest.mock(
  'services/notifications/balanceChange/unsubscribeForBalanceChange',
  () => ({
    unSubscribeForBalanceChange: jest.fn()
  })
)

jest.mock(
  'services/notifications/balanceChange/subscribeForBalanceChange',
  () => ({
    subscribeForBalanceChange: jest.fn()
  })
)

jest.mock('services/notifications/NotificationsService', () => ({
  getBlockedNotifications: jest.fn()
}))

jest.mock('utils/Logger', () => ({
  error: jest.fn()
}))

describe('subscribeBalanceChangeNotifications', () => {
  let listenerApi: AppListenerEffectAPI

  beforeEach(() => {
    listenerApi = {
      getState: jest.fn()
    } as unknown as AppListenerEffectAPI

    jest.clearAllMocks()
    ;(selectNotificationSubscription as jest.Mock).mockReturnValue(() => true)
  })

  it('should skip subscription if there are no accounts', async () => {
    ;(selectAccounts as jest.Mock).mockReturnValue({})

    await subscribeBalanceChangeNotifications(listenerApi)

    expect(FCMService.getFCMToken).not.toHaveBeenCalled()
    expect(registerDeviceToNotificationSender).not.toHaveBeenCalled()
    expect(subscribeForBalanceChange).not.toHaveBeenCalled()
  })

  it('should skip subscription if user has not enabled balance change notifications', async () => {
    ;(selectNotificationSubscription as jest.Mock).mockReturnValue(() => false)

    await subscribeBalanceChangeNotifications(listenerApi)

    expect(FCMService.getFCMToken).not.toHaveBeenCalled()
    expect(registerDeviceToNotificationSender).not.toHaveBeenCalled()
    expect(subscribeForBalanceChange).not.toHaveBeenCalled()
  })

  it('should unsubscribe if balance change notifications are blocked', async () => {
    ;(selectAccounts as jest.Mock).mockReturnValue({
      account1: { addressC: 'address1' }
    })
    ;(FCMService.getFCMToken as jest.Mock).mockResolvedValue('fcmToken')
    ;(registerDeviceToNotificationSender as jest.Mock).mockResolvedValue(
      'deviceArn'
    )
    ;(
      NotificationsService.getBlockedNotifications as jest.Mock
    ).mockResolvedValue(new Set([ChannelId.BALANCE_CHANGES]))

    await subscribeBalanceChangeNotifications(listenerApi)

    expect(unSubscribeForBalanceChange).toHaveBeenCalledWith({
      deviceArn: 'deviceArn'
    })
    expect(subscribeForBalanceChange).not.toHaveBeenCalled()
  })

  it('should subscribe for balance change notifications if not blocked', async () => {
    ;(selectAccounts as jest.Mock).mockReturnValue({
      account1: { addressC: 'address1' }
    })
    ;(FCMService.getFCMToken as jest.Mock).mockResolvedValue('fcmToken')
    ;(registerDeviceToNotificationSender as jest.Mock).mockResolvedValue(
      'deviceArn'
    )
    ;(
      NotificationsService.getBlockedNotifications as jest.Mock
    ).mockResolvedValue(new Set())
    ;(subscribeForBalanceChange as jest.Mock).mockResolvedValue({
      message: 'ok'
    })

    await subscribeBalanceChangeNotifications(listenerApi)

    expect(subscribeForBalanceChange).toHaveBeenCalledWith({
      addresses: ['address1'],
      chainIds: [
        ChainId.AVALANCHE_MAINNET_ID.toString(),
        ChainId.AVALANCHE_TESTNET_ID.toString()
      ],
      deviceArn: 'deviceArn'
    })
  })

  it('should log error and throw if subscription response is not "ok"', async () => {
    ;(selectAccounts as jest.Mock).mockReturnValue({
      account1: { addressC: 'address1' }
    })
    ;(FCMService.getFCMToken as jest.Mock).mockResolvedValue('fcmToken')
    ;(registerDeviceToNotificationSender as jest.Mock).mockResolvedValue(
      'deviceArn'
    )
    ;(
      NotificationsService.getBlockedNotifications as jest.Mock
    ).mockResolvedValue(new Set())
    ;(subscribeForBalanceChange as jest.Mock).mockResolvedValue({
      message: 'error'
    })

    await expect(
      subscribeBalanceChangeNotifications(listenerApi)
    ).rejects.toThrow('error')

    expect(Logger.error).toHaveBeenCalledWith(
      '[setupBalanceChangeNotifications.ts][setupBalanceChangeNotifications]error'
    )
  })

  it('should handle error during device registration and not proceed with subscription', async () => {
    ;(selectAccounts as jest.Mock).mockReturnValue({
      account1: { addressC: 'address1' }
    })
    ;(FCMService.getFCMToken as jest.Mock).mockResolvedValue('fcmToken')
    ;(registerDeviceToNotificationSender as jest.Mock).mockRejectedValue(
      new Error('Device registration error')
    )

    await expect(
      subscribeBalanceChangeNotifications(listenerApi)
    ).rejects.toThrow('Device registration error')

    expect(subscribeForBalanceChange).not.toHaveBeenCalled()
  })
})

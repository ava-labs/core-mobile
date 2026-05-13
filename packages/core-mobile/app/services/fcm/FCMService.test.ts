import messaging from '@react-native-firebase/messaging'
import { Platform } from 'react-native'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { ChannelId } from 'services/notifications/channels'
import { handleDeeplink } from 'contexts/DeeplinkContext/utils/handleDeeplink'
import FCMService from './FCMService'

// Override the messaging mock from tests/jestSetup/firebase.js so we can
// capture the handler passed to `onNotificationOpenedApp` and invoke it
// directly per test, simulating the OS calling us back on iOS warm-background
// notification taps.
jest.mock('@react-native-firebase/messaging', () =>
  jest.fn(() => ({
    onNotificationOpenedApp: jest.fn(),
    setBackgroundMessageHandler: jest.fn()
  }))
)

jest.mock('contexts/DeeplinkContext/utils/handleDeeplink', () => ({
  handleDeeplink: jest.fn()
}))

jest.mock('expo-router', () => ({
  router: { navigate: jest.fn() }
}))

describe('FCMService.listenForMessagesBackground (iOS warm-background)', () => {
  let registeredHandler: (remoteMessage: unknown) => void

  /**
   * Calls `listenForMessagesBackground` with `Platform.OS = 'ios'`, then
   * yanks the handler that the private `handleBackgroundMessageIos` method
   * registered with `messaging().onNotificationOpenedApp(...)`. Tests invoke
   * it directly with synthetic `remoteMessage` payloads.
   */
  const registerIosHandler = (): void => {
    const onNotificationOpenedApp = jest.fn(handler => {
      registeredHandler = handler
      return jest.fn()
    })
    ;(messaging as unknown as jest.Mock).mockReturnValue({
      onNotificationOpenedApp,
      setBackgroundMessageHandler: jest.fn()
    })
    FCMService.listenForMessagesBackground()
    expect(onNotificationOpenedApp).toHaveBeenCalledTimes(1)
  }

  beforeAll(() => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true })
  })

  beforeEach(() => {
    jest.spyOn(AnalyticsService, 'capture').mockResolvedValue(undefined)
    registerIosHandler()
  })

  it('captures PushNotificationPressed (isColdStart=false, handler=fcm) for a BALANCE_CHANGES press', async () => {
    // CP-14006 regression: previously this press was dropped because the
    // capture call sat AFTER `shouldSkipHandlingDeeplink` returned true for
    // the portfolio deeplink. The fix is "capture first, then route".
    await registeredHandler({
      notification: {
        title: 'You received tokens',
        body: '0.5 AVAX',
        android: { channelId: ChannelId.BALANCE_CHANGES }
      },
      data: {
        type: 'BALANCE_CHANGES',
        event: 'BALANCES_RECEIVED',
        title: 'You received tokens',
        body: '0.5 AVAX',
        accountAddress: '0xabc',
        chainId: '43114',
        transactionHash: '0xdeadbeef',
        url: 'core://portfolio'
      }
    })

    expect(AnalyticsService.capture).toHaveBeenCalledTimes(1)
    expect(AnalyticsService.capture).toHaveBeenCalledWith(
      'PushNotificationPressed',
      {
        channelId: ChannelId.BALANCE_CHANGES,
        deeplinkUrl: 'core://portfolio',
        isColdStart: false,
        handler: 'fcm'
      }
    )
  })

  it('captures the press even when the deeplink is skipped (capture happens before the deeplink-skip decision)', async () => {
    // `core://portfolio` matches the skip rule in `shouldSkipHandlingDeeplink`
    // — we still want to record the press for analytics, but we should NOT
    // route through `handleDeeplink` since the home screen surfaces it.
    await registeredHandler({
      notification: {
        title: 'You received tokens',
        body: '0.5 AVAX',
        android: { channelId: ChannelId.BALANCE_CHANGES }
      },
      data: {
        type: 'BALANCE_CHANGES',
        event: 'BALANCES_RECEIVED',
        title: 'You received tokens',
        body: '0.5 AVAX',
        accountAddress: '0xabc',
        chainId: '43114',
        transactionHash: '0xdeadbeef',
        url: 'core://portfolio'
      }
    })

    expect(AnalyticsService.capture).toHaveBeenCalledTimes(1)
    expect(handleDeeplink).not.toHaveBeenCalled()
  })

  it('invokes handleDeeplink for NEWS notifications that do not match the skip rules', async () => {
    await registeredHandler({
      notification: {
        title: 'AVAX price alert',
        body: 'AVAX is up 15%',
        android: { channelId: ChannelId.PRICE_ALERTS }
      },
      data: {
        type: 'NEWS',
        event: 'PRICE_ALERTS',
        title: 'AVAX price alert',
        body: 'AVAX is up 15%',
        url: 'core://watchlist'
      }
    })

    expect(AnalyticsService.capture).toHaveBeenCalledWith(
      'PushNotificationPressed',
      {
        channelId: ChannelId.PRICE_ALERTS,
        deeplinkUrl: 'core://watchlist',
        isColdStart: false,
        handler: 'fcm'
      }
    )
    expect(handleDeeplink).toHaveBeenCalledTimes(1)
    expect(handleDeeplink).toHaveBeenCalledWith(
      expect.objectContaining({
        deeplink: expect.objectContaining({ url: 'core://watchlist' })
      })
    )
  })

  it('falls back to EVENT_TO_CH_ID when notification.android.channelId is absent', async () => {
    // Backend dropped the legacy `android.channelId` for new SNS endpoints;
    // `resolveChannelId` should still pick PRICE_ALERTS from the event name.
    await registeredHandler({
      notification: {
        title: 'AVAX price alert',
        body: 'AVAX is up 15%'
      },
      data: {
        type: 'NEWS',
        event: 'PRICE_ALERTS',
        title: 'AVAX price alert',
        body: 'AVAX is up 15%',
        url: 'core://watchlist'
      }
    })

    expect(AnalyticsService.capture).toHaveBeenCalledWith(
      'PushNotificationPressed',
      expect.objectContaining({
        channelId: ChannelId.PRICE_ALERTS,
        isColdStart: false,
        handler: 'fcm'
      })
    )
  })

  it('does not capture or route when the payload fails schema validation', async () => {
    await registeredHandler({
      // Missing `data`, which the schema requires — `safeParse` will fail.
      notification: { title: 'oops', body: 'malformed' }
    })

    expect(AnalyticsService.capture).not.toHaveBeenCalled()
    expect(handleDeeplink).not.toHaveBeenCalled()
  })
})

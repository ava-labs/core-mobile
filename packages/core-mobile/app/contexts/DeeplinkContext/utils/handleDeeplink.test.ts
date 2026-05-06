import { closeInAppBrowser } from 'utils/openInAppBrowser'
import { dismissMeldStack } from 'features/meld/utils'
import { ACTIONS, DeepLink, DeepLinkOrigin } from '../types'
import { handleDeeplink } from './handleDeeplink'

jest.mock('utils/openInAppBrowser', () => ({
  closeInAppBrowser: jest.fn()
}))

jest.mock('features/meld/utils', () => ({
  dismissMeldStack: jest.fn()
}))

jest.mock('@walletconnect/utils', () => ({
  parseUri: jest.fn().mockReturnValue({ version: 2 })
}))

jest.mock('store/walletConnectV2/slice', () => ({
  newSession: jest.fn()
}))

jest.mock('utils/navigateFromDeeplink', () => ({
  navigateFromDeeplinkUrl: jest.fn()
}))

jest.mock('store/meld/slice', () => ({
  offrampSend: jest.fn()
}))

jest.mock('new/common/utils/toast', () => ({
  showSnackbar: jest.fn()
}))

describe('handleDeeplink', () => {
  const mockDispatch = jest.fn()
  const mockOpenUrl = jest.fn()

  const defaultArgs = {
    dispatch: mockDispatch,
    isEarnBlocked: false,
    isInAppDefiBorrowBlocked: false,
    openUrl: mockOpenUrl
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('handle OnrampCompleted deeplink', () => {
    it('should close in-app browser and dismiss meld stack when onrampCompleted deeplink is received', () => {
      const deeplink: DeepLink = {
        url: 'core://onrampCompleted?dismissCount=2',
        origin: DeepLinkOrigin.ORIGIN_DEEPLINK
      }

      handleDeeplink({ deeplink, ...defaultArgs })

      expect(closeInAppBrowser).toHaveBeenCalled()
      expect(dismissMeldStack).toHaveBeenCalledWith(
        ACTIONS.OnrampCompleted,
        expect.any(URLSearchParams)
      )

      const callArgs = (dismissMeldStack as jest.Mock).mock.calls[0]
      const searchParams: URLSearchParams = callArgs[1]
      expect(searchParams.get('dismissCount')).toBe('2')
    })

    it('should not process onrampCompleted if dismissCount is 0', () => {
      const deeplink: DeepLink = {
        url: 'core://onrampCompleted?dismissCount=0',
        origin: DeepLinkOrigin.ORIGIN_DEEPLINK
      }

      handleDeeplink({ deeplink, ...defaultArgs })

      expect(closeInAppBrowser).toHaveBeenCalled()
      expect(dismissMeldStack).toHaveBeenCalledWith(
        ACTIONS.OnrampCompleted,
        expect.any(URLSearchParams)
      )

      const callArgs = (dismissMeldStack as jest.Mock).mock.calls[0]
      const searchParams: URLSearchParams = callArgs[1]
      expect(searchParams.get('dismissCount')).toBe('0')
    })
  })
})

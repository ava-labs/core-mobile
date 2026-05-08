import { renderHook, act } from '@testing-library/react-hooks'
import { Linking } from 'react-native'
import InAppBrowser from 'react-native-inappbrowser-reborn'
import { useDisableLockAppStore } from 'features/accountSettings/store'

jest.mock('react-native-inappbrowser-reborn', () => ({
  __esModule: true,
  default: {
    openAuth: jest.fn(),
    isAvailable: jest.fn()
  }
}))

jest.mock('react-native', () => ({
  Linking: {
    openURL: jest.fn().mockResolvedValue(undefined)
  }
}))

jest.mock('features/accountSettings/store', () => ({
  useDisableLockAppStore: {
    setState: jest.fn(),
    getState: jest.fn(() => ({ disableLockApp: false }))
  }
}))

jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  }
}))

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(() => ({ addressC: '0x1234' }))
}))

jest.mock('@avalabs/k2-alpine', () => ({
  useTheme: jest.fn(() => ({
    theme: {
      colors: {
        $surfacePrimary: '#fff',
        $textPrimary: '#000',
        $surfaceSecondary: '#eee'
      }
    }
  }))
}))

jest.mock('utils/openInAppBrowser', () => ({
  openInAppBrowser: jest.fn()
}))

jest.mock('store/account', () => ({
  selectActiveAccount: jest.fn()
}))

jest.mock('react-native-config', () => ({
  __esModule: true,
  default: {
    PROXY_URL: 'https://proxy.test',
    COINBASE_APP_ID: 'test-app-id'
  }
}))

jest.mock('@coinbase/cbpay-js', () => ({
  generateOnRampURL: jest.fn(() => 'https://pay.coinbase.com/test')
}))

jest.mock('@avalabs/core-utils-sdk', () => ({
  resolve: jest.fn()
}))

jest.mock('common/utils/toast', () => ({
  showSnackbar: jest.fn()
}))

import useInAppBrowser from './useInAppBrowser'

const mockInAppBrowser = InAppBrowser as jest.Mocked<typeof InAppBrowser>
const mockLinkingOpenURL = Linking.openURL as jest.Mock
const mockSetState = useDisableLockAppStore.setState as jest.Mock

const TEST_URL = 'https://example.com/onramp'
const REDIRECT_SCHEME = 'core://'

describe('useInAppBrowser - openUrlWithRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockInAppBrowser.isAvailable.mockResolvedValue(true)
  })

  it('calls Linking.openURL with the redirect URL when openAuth returns success', async () => {
    const redirectUrl = 'core://onrampCompleted?dismissCount=1'
    mockInAppBrowser.openAuth.mockResolvedValue({
      type: 'success',
      url: redirectUrl
    })

    const { result } = renderHook(() => useInAppBrowser())

    await act(async () => {
      await result.current.openUrlWithRedirect(TEST_URL, REDIRECT_SCHEME)
    })

    expect(mockLinkingOpenURL).toHaveBeenCalledWith(redirectUrl)
    expect(mockLinkingOpenURL).toHaveBeenCalledTimes(1)
  })

  it('does not call Linking.openURL when openAuth returns cancel', async () => {
    mockInAppBrowser.openAuth.mockResolvedValue({ type: 'cancel' })

    const { result } = renderHook(() => useInAppBrowser())

    await act(async () => {
      await result.current.openUrlWithRedirect(TEST_URL, REDIRECT_SCHEME)
    })

    expect(mockLinkingOpenURL).not.toHaveBeenCalled()
  })

  it('does not call Linking.openURL when openAuth returns dismiss', async () => {
    mockInAppBrowser.openAuth.mockResolvedValue({ type: 'dismiss' })

    const { result } = renderHook(() => useInAppBrowser())

    await act(async () => {
      await result.current.openUrlWithRedirect(TEST_URL, REDIRECT_SCHEME)
    })

    expect(mockLinkingOpenURL).not.toHaveBeenCalled()
  })

  it('calls Linking.openURL with the original URL when InAppBrowser is not available', async () => {
    mockInAppBrowser.isAvailable.mockResolvedValue(false)

    const { result } = renderHook(() => useInAppBrowser())

    await act(async () => {
      await result.current.openUrlWithRedirect(TEST_URL, REDIRECT_SCHEME)
    })

    expect(mockInAppBrowser.openAuth).not.toHaveBeenCalled()
    expect(mockLinkingOpenURL).toHaveBeenCalledWith(TEST_URL)
    expect(mockLinkingOpenURL).toHaveBeenCalledTimes(1)
  })

  it('calls Linking.openURL with the original URL when openAuth throws', async () => {
    mockInAppBrowser.openAuth.mockRejectedValue(new Error('browser error'))

    const { result } = renderHook(() => useInAppBrowser())

    await act(async () => {
      await result.current.openUrlWithRedirect(TEST_URL, REDIRECT_SCHEME)
    })

    expect(mockLinkingOpenURL).toHaveBeenCalledWith(TEST_URL)
    expect(mockLinkingOpenURL).toHaveBeenCalledTimes(1)
  })

  it('sets disableLockApp to true before opening and false after', async () => {
    mockInAppBrowser.openAuth.mockResolvedValue({ type: 'cancel' })

    const { result } = renderHook(() => useInAppBrowser())

    await act(async () => {
      await result.current.openUrlWithRedirect(TEST_URL, REDIRECT_SCHEME)
    })

    expect(mockSetState).toHaveBeenCalledWith({ disableLockApp: true })
    expect(mockSetState).toHaveBeenCalledWith({ disableLockApp: false })

    const setTrueIndex = mockSetState.mock.calls.findIndex(
      call => call[0].disableLockApp === true
    )
    const setFalseIndex = mockSetState.mock.calls.findIndex(
      call => call[0].disableLockApp === false
    )
    expect(setTrueIndex).toBeLessThan(setFalseIndex)
  })

  it('sets disableLockApp to false in finally block even when openAuth throws', async () => {
    mockInAppBrowser.openAuth.mockRejectedValue(new Error('browser error'))

    const { result } = renderHook(() => useInAppBrowser())

    await act(async () => {
      await result.current.openUrlWithRedirect(TEST_URL, REDIRECT_SCHEME)
    })

    expect(mockSetState).toHaveBeenCalledWith({ disableLockApp: true })
    expect(mockSetState).toHaveBeenCalledWith({ disableLockApp: false })
  })
})

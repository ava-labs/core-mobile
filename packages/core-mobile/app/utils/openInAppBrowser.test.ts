import { Linking } from 'react-native'
import InAppBrowser from 'react-native-inappbrowser-reborn'
import { openInAppBrowserForAuth } from './openInAppBrowser'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock('react-native-inappbrowser-reborn', () => ({
  __esModule: true,
  default: {
    isAvailable: jest.fn(),
    open: jest.fn(),
    openAuth: jest.fn(),
    close: jest.fn()
  }
}))

jest.mock('features/accountSettings/store', () => ({
  useDisableLockAppStore: {
    setState: jest.fn()
  }
}))

jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: { error: jest.fn() }
}))

const mockIsAvailable = InAppBrowser.isAvailable as jest.Mock
const mockOpenAuth = InAppBrowser.openAuth as jest.Mock
const mockOpenURL = Linking.openURL as jest.Mock

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('openInAppBrowserForAuth', () => {
  const url = 'https://meld.io/widget'
  const redirectUrl = 'core://onrampCompleted?dismissCount=2'
  const options = {}

  beforeEach(() => {
    jest.clearAllMocks()
    mockIsAvailable.mockResolvedValue(true)
  })

  it('returns the callback URL when openAuth resolves with type success', async () => {
    const callbackUrl = 'core://onrampCompleted?dismissCount=2'
    mockOpenAuth.mockResolvedValueOnce({ type: 'success', url: callbackUrl })

    const result = await openInAppBrowserForAuth(url, redirectUrl, options)

    expect(mockOpenAuth).toHaveBeenCalledWith(url, redirectUrl, options)
    expect(result).toBe(callbackUrl)
  })

  it('returns undefined when openAuth resolves with type cancel', async () => {
    mockOpenAuth.mockResolvedValueOnce({ type: 'cancel' })

    const result = await openInAppBrowserForAuth(url, redirectUrl, options)

    expect(result).toBeUndefined()
  })

  it('calls failSafe (Linking.openURL) and returns undefined when InAppBrowser is not available', async () => {
    mockIsAvailable.mockResolvedValueOnce(false)
    mockOpenURL.mockResolvedValueOnce(undefined)

    const result = await openInAppBrowserForAuth(url, redirectUrl, options)

    expect(mockOpenURL).toHaveBeenCalledWith(url)
    expect(result).toBeUndefined()
  })

  it('calls failSafe (Linking.openURL) and returns undefined when openAuth throws', async () => {
    mockOpenAuth.mockRejectedValueOnce(new Error('session cancelled'))
    mockOpenURL.mockResolvedValueOnce(undefined)

    const result = await openInAppBrowserForAuth(url, redirectUrl, options)

    expect(mockOpenURL).toHaveBeenCalledWith(url)
    expect(result).toBeUndefined()
  })
})

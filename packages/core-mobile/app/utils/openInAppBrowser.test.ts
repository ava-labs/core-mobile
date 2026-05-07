import { Linking } from 'react-native'
import InAppBrowser from 'react-native-inappbrowser-reborn'
import { useDisableLockAppStore } from 'features/accountSettings/store'
import Logger from 'utils/Logger'
import { openInAppBrowser, openInAppBrowserForAuth } from './openInAppBrowser'

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
  default: {
    error: jest.fn()
  }
}))

const mockIsAvailable = InAppBrowser.isAvailable as jest.Mock
const mockOpen = InAppBrowser.open as jest.Mock
const mockOpenAuth = InAppBrowser.openAuth as jest.Mock
const mockSetState = useDisableLockAppStore.setState as jest.Mock
const mockOpenURL = Linking.openURL as jest.Mock
const mockLogError = Logger.error as jest.Mock

const testUrl = 'https://example.com'
const testOptions = {}

describe('openInAppBrowser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOpenURL.mockResolvedValue(undefined)
  })

  it('should set disableLockApp to false and call Linking.openURL as failsafe when InAppBrowser is not available', async () => {
    mockIsAvailable.mockResolvedValueOnce(false)

    await openInAppBrowser(testUrl, testOptions)

    expect(mockSetState).toHaveBeenCalledWith({ disableLockApp: false })
    expect(mockOpenURL).toHaveBeenCalledWith(testUrl)
    expect(mockOpen).not.toHaveBeenCalled()
  })

  it('should reset disableLockApp to false and NOT call Linking.openURL when result type is cancel', async () => {
    mockIsAvailable.mockResolvedValueOnce(true)
    mockOpen.mockResolvedValueOnce({ type: 'cancel' })

    await openInAppBrowser(testUrl, testOptions)

    expect(mockSetState).toHaveBeenCalledWith({ disableLockApp: true })
    expect(mockSetState).toHaveBeenCalledWith({ disableLockApp: false })
    expect(mockOpenURL).not.toHaveBeenCalled()
  })

  it('should reset disableLockApp to false and NOT call Linking.openURL when result type is dismiss', async () => {
    mockIsAvailable.mockResolvedValueOnce(true)
    mockOpen.mockResolvedValueOnce({ type: 'dismiss' })

    await openInAppBrowser(testUrl, testOptions)

    expect(mockSetState).toHaveBeenCalledWith({ disableLockApp: true })
    expect(mockSetState).toHaveBeenCalledWith({ disableLockApp: false })
    expect(mockOpenURL).not.toHaveBeenCalled()
  })

  it('should reset disableLockApp to false AND call Linking.openURL with redirect URL when result is success with allowed URL', async () => {
    const redirectUrl = 'core://onrampCompleted?dismissCount=2'
    mockIsAvailable.mockResolvedValueOnce(true)
    mockOpen.mockResolvedValueOnce({ type: 'success', url: redirectUrl })

    await openInAppBrowser(testUrl, testOptions)

    expect(mockSetState).toHaveBeenCalledWith({ disableLockApp: true })
    expect(mockSetState).toHaveBeenCalledWith({ disableLockApp: false })
    expect(mockOpenURL).toHaveBeenCalledWith(redirectUrl)
    expect(mockLogError).not.toHaveBeenCalled()
  })

  it('should block and log error when result is success with disallowed redirect URL', async () => {
    const maliciousUrl = 'core://wc?uri=malicious'
    mockIsAvailable.mockResolvedValueOnce(true)
    mockOpen.mockResolvedValueOnce({ type: 'success', url: maliciousUrl })

    await openInAppBrowser(testUrl, testOptions)

    expect(mockSetState).toHaveBeenCalledWith({ disableLockApp: false })
    expect(mockOpenURL).not.toHaveBeenCalled()
    expect(mockLogError).toHaveBeenCalledWith(
      expect.stringContaining(maliciousUrl)
    )
  })

  it('should reset disableLockApp to false and call Linking.openURL as failsafe when InAppBrowser.open throws', async () => {
    mockIsAvailable.mockResolvedValueOnce(true)
    mockOpen.mockRejectedValueOnce(new Error('Browser error'))

    await openInAppBrowser(testUrl, testOptions)

    expect(mockSetState).toHaveBeenCalledWith({ disableLockApp: true })
    expect(mockSetState).toHaveBeenCalledWith({ disableLockApp: false })
    expect(mockOpenURL).toHaveBeenCalledWith(testUrl)
  })
})

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

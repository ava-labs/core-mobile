import Clipboard from '@react-native-clipboard/clipboard'
import { AppState, AppStateStatus } from 'react-native'
import {
  copySecretToClipboard,
  copyToClipboard,
  SECRET_CLIPBOARD_TTL_MS,
  SECRET_COPIED_MESSAGE
} from './clipboard'
import { showSnackbar } from './toast'

let mockClipboardContent = ''
jest.mock('@react-native-clipboard/clipboard', () => ({
  __esModule: true,
  default: {
    setString: jest.fn((value: string) => {
      mockClipboardContent = value
    }),
    getString: jest.fn(() => Promise.resolve(mockClipboardContent))
  }
}))

jest.mock('./toast', () => ({ showSnackbar: jest.fn() }))
jest.mock('utils/Logger', () => ({ error: jest.fn() }))

const SECRET = 'test test test test test test test test test test test junk'

let appStateListeners: Array<(state: AppStateStatus) => void> = []
const mockRemove = jest.fn()

// let the async clipboard read + clear settle
const flush = async (): Promise<void> => {
  await Promise.resolve()
  await Promise.resolve()
}

const emitAppState = (state: AppStateStatus): void => {
  appStateListeners.forEach(listener => listener(state))
}

beforeEach(() => {
  jest.useFakeTimers()
  mockClipboardContent = ''
  appStateListeners = []
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_type, listener) => {
      appStateListeners.push(listener as (state: AppStateStatus) => void)
      return {
        remove: () => {
          mockRemove()
          appStateListeners = appStateListeners.filter(l => l !== listener)
        }
      }
    })
})

afterEach(async () => {
  // drain any pending clear from the previous test
  jest.advanceTimersByTime(SECRET_CLIPBOARD_TTL_MS)
  await flush()
  jest.useRealTimers()
})

describe('copySecretToClipboard', () => {
  it('copies the secret and tells the user it will be cleared', () => {
    copySecretToClipboard(SECRET)

    expect(Clipboard.setString).toHaveBeenCalledWith(SECRET)
    expect(mockClipboardContent).toBe(SECRET)
    expect(showSnackbar).toHaveBeenCalledWith(SECRET_COPIED_MESSAGE)
    expect(SECRET_COPIED_MESSAGE).toContain('60 seconds')
  })

  it('accepts a custom message', () => {
    copySecretToClipboard(SECRET, 'Private key copied')
    expect(showSnackbar).toHaveBeenCalledWith('Private key copied')
  })

  it('does nothing for an empty secret', () => {
    copySecretToClipboard('')
    copySecretToClipboard(undefined)
    expect(Clipboard.setString).not.toHaveBeenCalled()
    expect(showSnackbar).not.toHaveBeenCalled()
  })

  it('clears the clipboard after 60 seconds (WSR-PHYS-001)', async () => {
    copySecretToClipboard(SECRET)

    jest.advanceTimersByTime(SECRET_CLIPBOARD_TTL_MS - 1)
    await flush()
    expect(mockClipboardContent).toBe(SECRET)

    jest.advanceTimersByTime(1)
    await flush()
    expect(mockClipboardContent).toBe('')
    expect(mockRemove).toHaveBeenCalled()
  })

  it('does not clear the clipboard if the user copied something else', async () => {
    copySecretToClipboard(SECRET)
    mockClipboardContent = 'something else'

    jest.advanceTimersByTime(SECRET_CLIPBOARD_TTL_MS)
    await flush()

    expect(mockClipboardContent).toBe('something else')
    expect(Clipboard.setString).toHaveBeenCalledTimes(1)
  })

  it('clears an expired secret when the app returns to the foreground', async () => {
    const now = Date.now()
    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(now)
    copySecretToClipboard(SECRET)

    // timers are paused in the background: time passes but the timer never fires
    dateSpy.mockReturnValue(now + SECRET_CLIPBOARD_TTL_MS + 5000)
    emitAppState('background')
    await flush()
    expect(mockClipboardContent).toBe(SECRET)

    emitAppState('active')
    await flush()
    expect(mockClipboardContent).toBe('')
    dateSpy.mockRestore()
  })

  it('does not clear early when the app becomes active before expiry', async () => {
    const now = Date.now()
    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(now)
    copySecretToClipboard(SECRET)

    dateSpy.mockReturnValue(now + 10_000)
    emitAppState('active')
    await flush()
    expect(mockClipboardContent).toBe(SECRET)
    dateSpy.mockRestore()
  })

  it('restarts the 60s window when another secret is copied', async () => {
    copySecretToClipboard('first secret')
    jest.advanceTimersByTime(30_000)

    copySecretToClipboard(SECRET)
    expect(mockRemove).toHaveBeenCalledTimes(1) // previous listener removed
    expect(appStateListeners).toHaveLength(1)

    jest.advanceTimersByTime(30_000)
    await flush()
    expect(mockClipboardContent).toBe(SECRET)

    jest.advanceTimersByTime(30_000)
    await flush()
    expect(mockClipboardContent).toBe('')
  })
})

describe('copyToClipboard', () => {
  it('copies non-secret content without scheduling a clear', async () => {
    copyToClipboard('0xabc', 'Address copied')
    expect(mockClipboardContent).toBe('0xabc')
    expect(showSnackbar).toHaveBeenCalledWith('Address copied')

    jest.advanceTimersByTime(SECRET_CLIPBOARD_TTL_MS)
    await flush()
    expect(mockClipboardContent).toBe('0xabc')
  })
})

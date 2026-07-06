import { renderHook, act } from '@testing-library/react-hooks'
import { onlineManager } from '@tanstack/react-query'
import { useOnlineStatus } from './useOnlineStatus'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

let subscriberCallback: (() => void) | undefined

jest.mock('@tanstack/react-query', () => ({
  onlineManager: {
    isOnline: jest.fn(),
    subscribe: jest.fn()
  }
}))

const mockOnlineManager = onlineManager as unknown as {
  isOnline: jest.Mock
  subscribe: jest.Mock
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useOnlineStatus', () => {
  beforeEach(() => {
    subscriberCallback = undefined
    mockOnlineManager.isOnline.mockReturnValue(true)
    mockOnlineManager.subscribe.mockImplementation((cb: () => void) => {
      subscriberCallback = cb
      return jest.fn() // unsubscribe
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns current online status on mount', () => {
    mockOnlineManager.isOnline.mockReturnValue(true)

    const { result } = renderHook(() => useOnlineStatus())

    expect(result.current).toBe(true)
  })

  it('returns false when initially offline', () => {
    mockOnlineManager.isOnline.mockReturnValue(false)

    const { result } = renderHook(() => useOnlineStatus())

    expect(result.current).toBe(false)
  })

  it('subscribes to onlineManager on mount', () => {
    renderHook(() => useOnlineStatus())

    expect(mockOnlineManager.subscribe).toHaveBeenCalledTimes(1)
    expect(mockOnlineManager.subscribe).toHaveBeenCalledWith(
      expect.any(Function)
    )
  })

  it('updates when onlineManager emits a change', () => {
    mockOnlineManager.isOnline.mockReturnValue(true)

    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(true)

    // Simulate going offline
    mockOnlineManager.isOnline.mockReturnValue(false)
    act(() => {
      subscriberCallback?.()
    })

    expect(result.current).toBe(false)
  })

  it('transitions from offline to online', () => {
    mockOnlineManager.isOnline.mockReturnValue(false)

    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(false)

    // Simulate reconnection
    mockOnlineManager.isOnline.mockReturnValue(true)
    act(() => {
      subscriberCallback?.()
    })

    expect(result.current).toBe(true)
  })

  it('unsubscribes on unmount', () => {
    const unsubscribe = jest.fn()
    mockOnlineManager.subscribe.mockReturnValue(unsubscribe)

    const { unmount } = renderHook(() => useOnlineStatus())
    unmount()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})

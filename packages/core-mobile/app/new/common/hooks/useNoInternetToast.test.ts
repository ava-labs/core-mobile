import { renderHook, act } from '@testing-library/react-hooks'
import { showNoInternetToast } from 'common/utils/toast'
import { useSegments } from 'expo-router'
import { useOnlineStatus } from './useOnlineStatus'
import { useNoInternetToast } from './useNoInternetToast'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock('common/utils/toast', () => ({
  showNoInternetToast: jest.fn()
}))

jest.mock('expo-router', () => ({
  useSegments: jest.fn()
}))

jest.mock('./useOnlineStatus', () => ({
  useOnlineStatus: jest.fn()
}))

jest.mock('utils/uuid', () => ({
  uuid: jest.fn().mockReturnValue('test-uuid')
}))

const mockUseOnlineStatus = useOnlineStatus as jest.MockedFunction<
  typeof useOnlineStatus
>
const mockUseSegments = useSegments as unknown as jest.MockedFunction<
  () => string[]
>
const mockShowNoInternetToast = showNoInternetToast as jest.MockedFunction<
  typeof showNoInternetToast
>

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useNoInternetToast', () => {
  beforeEach(() => {
    mockUseOnlineStatus.mockReturnValue(true)
    mockUseSegments.mockReturnValue([])
    global.toast = {
      hideAll: jest.fn(),
      show: jest.fn(),
      hide: jest.fn(),
      update: jest.fn()
    } as any
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('does not show toast when online', () => {
    mockUseOnlineStatus.mockReturnValue(true)

    renderHook(() => useNoInternetToast())

    expect(mockShowNoInternetToast).not.toHaveBeenCalled()
  })

  it('shows toast when going offline', () => {
    mockUseOnlineStatus.mockReturnValue(true)

    const { rerender } = renderHook(() => useNoInternetToast())

    // Go offline
    mockUseOnlineStatus.mockReturnValue(false)
    rerender()

    expect(mockShowNoInternetToast).toHaveBeenCalledTimes(1)
    expect(mockShowNoInternetToast).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Function)
    )
  })

  it('hides all toasts when coming back online', () => {
    // Start offline
    mockUseOnlineStatus.mockReturnValue(false)

    const { rerender } = renderHook(() => useNoInternetToast())

    // Go online
    mockUseOnlineStatus.mockReturnValue(true)
    rerender()

    expect(global.toast?.hideAll).toHaveBeenCalled()
  })

  it('re-shows toast on tab switch when offline and dismissed', () => {
    // Start online, then go offline
    mockUseOnlineStatus.mockReturnValue(true)
    mockUseSegments.mockReturnValue(['(signedIn)', '(tabs)', 'portfolio'])

    const { rerender } = renderHook(() => useNoInternetToast())

    // Go offline — toast appears
    mockUseOnlineStatus.mockReturnValue(false)
    rerender()

    expect(mockShowNoInternetToast).toHaveBeenCalledTimes(1)

    // Simulate user dismissing the toast
    const onDismiss = mockShowNoInternetToast.mock.calls[0]![1]
    act(() => {
      onDismiss()
    })

    // Switch tab — toast should re-appear
    mockUseSegments.mockReturnValue(['(signedIn)', '(tabs)', 'browser'])
    rerender()

    expect(mockShowNoInternetToast).toHaveBeenCalledTimes(2)
  })

  it('re-shows toast on seedless onboarding screen change when offline and dismissed', () => {
    mockUseOnlineStatus.mockReturnValue(true)
    mockUseSegments.mockReturnValue(['(signedIn)', 'seedless', 'step1'])

    const { rerender } = renderHook(() => useNoInternetToast())

    // Go offline
    mockUseOnlineStatus.mockReturnValue(false)
    rerender()

    // Dismiss
    const onDismiss = mockShowNoInternetToast.mock.calls[0]![1]
    act(() => {
      onDismiss()
    })

    // Navigate within seedless flow
    mockUseSegments.mockReturnValue(['(signedIn)', 'seedless', 'step2'])
    rerender()

    expect(mockShowNoInternetToast).toHaveBeenCalledTimes(2)
  })

  it('re-shows toast on signup screen change when offline and dismissed', () => {
    mockUseOnlineStatus.mockReturnValue(true)
    mockUseSegments.mockReturnValue(['signup', 'step1'])

    const { rerender } = renderHook(() => useNoInternetToast())

    // Go offline
    mockUseOnlineStatus.mockReturnValue(false)
    rerender()

    // Dismiss
    const onDismiss = mockShowNoInternetToast.mock.calls[0]![1]
    act(() => {
      onDismiss()
    })

    // Navigate within signup flow
    mockUseSegments.mockReturnValue(['signup', 'step2'])
    rerender()

    expect(mockShowNoInternetToast).toHaveBeenCalledTimes(2)
  })

  it('does not re-show toast on segment change if not dismissed', () => {
    mockUseOnlineStatus.mockReturnValue(true)
    mockUseSegments.mockReturnValue(['(signedIn)', '(tabs)', 'portfolio'])

    const { rerender } = renderHook(() => useNoInternetToast())

    // Go offline — toast appears but NOT dismissed
    mockUseOnlineStatus.mockReturnValue(false)
    rerender()

    expect(mockShowNoInternetToast).toHaveBeenCalledTimes(1)

    // Switch tab — should NOT re-show because toast is still visible
    mockUseSegments.mockReturnValue(['(signedIn)', '(tabs)', 'browser'])
    rerender()

    expect(mockShowNoInternetToast).toHaveBeenCalledTimes(1)
  })

  it('does not re-show toast on non-tab/onboarding routes', () => {
    mockUseOnlineStatus.mockReturnValue(true)
    mockUseSegments.mockReturnValue(['(signedIn)', 'settings'])

    const { rerender } = renderHook(() => useNoInternetToast())

    // Go offline
    mockUseOnlineStatus.mockReturnValue(false)
    rerender()

    // Dismiss
    const onDismiss = mockShowNoInternetToast.mock.calls[0]![1]
    act(() => {
      onDismiss()
    })

    // Navigate to another non-tab route
    mockUseSegments.mockReturnValue(['(signedIn)', 'settings', 'advanced'])
    rerender()

    // Should not re-show — not a tab or onboarding route
    expect(mockShowNoInternetToast).toHaveBeenCalledTimes(1)
  })
})

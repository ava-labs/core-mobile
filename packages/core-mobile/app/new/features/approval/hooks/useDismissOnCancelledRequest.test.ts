import { renderHook } from '@testing-library/react-hooks'
import { router } from 'expo-router'
import { useDismissOnCancelledRequest } from './useDismissOnCancelledRequest'

jest.mock('expo-router', () => ({
  router: { canGoBack: jest.fn(() => true), back: jest.fn() }
}))

const mockCanGoBack = router.canGoBack as jest.Mock
const mockBack = router.back as jest.Mock

describe('useDismissOnCancelledRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCanGoBack.mockReturnValue(true)
  })

  it('dismisses on mount when the request signal is already aborted', () => {
    const controller = new AbortController()
    controller.abort()

    renderHook(() => useDismissOnCancelledRequest(controller.signal))

    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('does not dismiss when the signal is not aborted', () => {
    const controller = new AbortController()

    renderHook(() => useDismissOnCancelledRequest(controller.signal))

    expect(mockBack).not.toHaveBeenCalled()
  })

  it('does not dismiss when there is no signal (non-browser request)', () => {
    renderHook(() => useDismissOnCancelledRequest(undefined))

    expect(mockBack).not.toHaveBeenCalled()
  })

  it('does not call back when there is nothing to go back to', () => {
    mockCanGoBack.mockReturnValue(false)
    const controller = new AbortController()
    controller.abort()

    renderHook(() => useDismissOnCancelledRequest(controller.signal))

    expect(mockBack).not.toHaveBeenCalled()
  })
})

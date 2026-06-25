import { renderHook } from '@testing-library/react-hooks'
import { router } from 'expo-router'
import { useDismissOnCancelledRequest } from './useDismissOnCancelledRequest'

// Capture the navigation transitionEnd listener so tests can simulate the
// native present animation completing.
let transitionEndCb: (() => void) | undefined
const mockAddListener = jest.fn((event: string, cb: () => void) => {
  if (event === 'transitionEnd') transitionEndCb = cb
  return jest.fn() // unsubscribe
})

jest.mock('expo-router', () => ({
  router: { canGoBack: jest.fn(() => true), back: jest.fn() },
  useNavigation: () => ({ addListener: mockAddListener })
}))

const mockIsLedgerSigning = jest.fn(() => false)
jest.mock('vmModule/ApprovalController/ApprovalController', () => ({
  approvalController: {
    isLedgerSigningInProgress: () => mockIsLedgerSigning()
  }
}))

const mockCanGoBack = router.canGoBack as jest.Mock
const mockBack = router.back as jest.Mock

// Simulate the formSheet finishing its present animation.
const completePresent = (): void => transitionEndCb?.()

describe('useDismissOnCancelledRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCanGoBack.mockReturnValue(true)
    mockIsLedgerSigning.mockReturnValue(false)
    transitionEndCb = undefined
  })

  it('does NOT dismiss until the present transition completes, then dismisses (abort before present)', () => {
    const controller = new AbortController()
    controller.abort()

    renderHook(() => useDismissOnCancelledRequest(controller.signal))
    // Aborted at mount, but the sheet is still presenting — must NOT pop yet
    // (iOS drops a back() mid-present).
    expect(mockBack).not.toHaveBeenCalled()

    completePresent()
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('dismisses immediately when the signal aborts after the sheet has presented', () => {
    const controller = new AbortController()

    renderHook(() => useDismissOnCancelledRequest(controller.signal))
    completePresent() // sheet finished presenting
    expect(mockBack).not.toHaveBeenCalled()

    controller.abort()
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('does not dismiss when the signal is not aborted', () => {
    const controller = new AbortController()

    renderHook(() => useDismissOnCancelledRequest(controller.signal))
    completePresent()

    expect(mockBack).not.toHaveBeenCalled()
  })

  it('does not dismiss when there is no signal (non-browser request)', () => {
    renderHook(() => useDismissOnCancelledRequest(undefined))
    completePresent()

    expect(mockBack).not.toHaveBeenCalled()
  })

  it('does not call back when there is nothing to go back to', () => {
    mockCanGoBack.mockReturnValue(false)
    const controller = new AbortController()
    controller.abort()

    renderHook(() => useDismissOnCancelledRequest(controller.signal))
    completePresent()

    expect(mockBack).not.toHaveBeenCalled()
  })

  it('dismisses via the fallback timer when transitionEnd never fires (nested-stack initial route)', () => {
    // ApprovalScreen is the initial route of a nested stack presented as a sheet
    // by its parent, so its own navigator never emits transitionEnd. Dismissal
    // must not depend solely on that event. (CP-14422)
    jest.useFakeTimers()
    const controller = new AbortController()

    renderHook(() => useDismissOnCancelledRequest(controller.signal))
    // transitionEnd never fires — do NOT call completePresent().
    controller.abort()
    expect(mockBack).not.toHaveBeenCalled() // deferred: not yet "presented"

    jest.advanceTimersByTime(2000) // fallback elapses
    expect(mockBack).toHaveBeenCalledTimes(1)
    jest.useRealTimers()
  })

  it('does NOT dismiss while on-device Ledger signing is in progress', () => {
    // Once signing has begun the cross-origin nav must not pop the review screen
    // out from under a signature; the controller dismisses on settle. (CP-14422)
    mockIsLedgerSigning.mockReturnValue(true)
    const controller = new AbortController()

    renderHook(() => useDismissOnCancelledRequest(controller.signal))
    completePresent()
    controller.abort()

    expect(mockBack).not.toHaveBeenCalled()
  })

  it('dismisses at most once', () => {
    const controller = new AbortController()
    controller.abort()

    renderHook(() => useDismissOnCancelledRequest(controller.signal))
    completePresent()
    completePresent()
    controller.abort()

    expect(mockBack).toHaveBeenCalledTimes(1)
  })
})

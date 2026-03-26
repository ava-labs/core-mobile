/**
 * navigationGuard patches expo-router's router singleton at module load time
 * and maintains module-level state (closingTransitionCount, pendingCallbacks).
 *
 * To get a clean slate per test we use jest.isolateModules + jest.doMock so
 * each beforeEach loads a fresh copy of the module with its own mock router
 * and a zeroed counter.
 *
 * Calling routerMock.push/navigate/replace exercises the patched functions.
 * The original jest.fn()s are saved before isolation so we can assert on them:
 * the module captures them via .bind(), and bind() preserves call recording on
 * the original mock.
 */

describe('navigationGuard', () => {
  let originalPush: jest.Mock
  let originalNavigate: jest.Mock
  let originalReplace: jest.Mock
  type RouterMethod = (href: unknown, options?: unknown) => void
  let routerMock: {
    push: RouterMethod
    navigate: RouterMethod
    replace: RouterMethod
  }
  let onClosingTransitionStart: () => void
  let onClosingTransitionEnd: () => void
  let TRANSITION_FAILSAFE_MS: number

  beforeEach(() => {
    originalPush = jest.fn()
    originalNavigate = jest.fn()
    originalReplace = jest.fn()
    routerMock = {
      push: originalPush,
      navigate: originalNavigate,
      replace: originalReplace
    }

    jest.isolateModules(() => {
      jest.doMock('expo-router', () => ({ router: routerMock }))
      // require() triggers the module's top-level patching against routerMock
      const guard = require('./navigationGuard')
      onClosingTransitionStart = guard.onClosingTransitionStart
      onClosingTransitionEnd = guard.onClosingTransitionEnd
      TRANSITION_FAILSAFE_MS = guard.TRANSITION_FAILSAFE_MS
      // After this point routerMock.push/navigate/replace are the patched wrappers;
      // originalPush/Navigate/Replace still point to the original jest.fn()s.
    })
  })

  describe('when no transition is active', () => {
    it('calls push immediately', () => {
      routerMock.push('/home')
      expect(originalPush).toHaveBeenCalledTimes(1)
      expect(originalPush).toHaveBeenCalledWith('/home', undefined)
    })

    it('calls navigate immediately', () => {
      routerMock.navigate('/profile')
      expect(originalNavigate).toHaveBeenCalledTimes(1)
      expect(originalNavigate).toHaveBeenCalledWith('/profile', undefined)
    })

    it('calls replace immediately', () => {
      routerMock.replace('/settings')
      expect(originalReplace).toHaveBeenCalledTimes(1)
      expect(originalReplace).toHaveBeenCalledWith('/settings', undefined)
    })

    it('forwards options to the original method', () => {
      const options = { relativeToDirectory: true }
      routerMock.push('/home', options)
      expect(originalPush).toHaveBeenCalledWith('/home', options)
    })
  })

  describe('when a closing transition is active', () => {
    it('queues push and flushes it after onClosingTransitionEnd', () => {
      onClosingTransitionStart()
      routerMock.push('/home')

      expect(originalPush).not.toHaveBeenCalled()

      onClosingTransitionEnd()
      expect(originalPush).toHaveBeenCalledTimes(1)
      expect(originalPush).toHaveBeenCalledWith('/home', undefined)
    })

    it('queues navigate and flushes it after onClosingTransitionEnd', () => {
      onClosingTransitionStart()
      routerMock.navigate('/profile')

      expect(originalNavigate).not.toHaveBeenCalled()

      onClosingTransitionEnd()
      expect(originalNavigate).toHaveBeenCalledTimes(1)
      expect(originalNavigate).toHaveBeenCalledWith('/profile', undefined)
    })

    it('queues replace and flushes it after onClosingTransitionEnd', () => {
      onClosingTransitionStart()
      routerMock.replace('/settings')

      expect(originalReplace).not.toHaveBeenCalled()

      onClosingTransitionEnd()
      expect(originalReplace).toHaveBeenCalledTimes(1)
      expect(originalReplace).toHaveBeenCalledWith('/settings', undefined)
    })

    it('flushes queued calls in the order they were made', () => {
      const callOrder: string[] = []
      originalPush.mockImplementation(() => callOrder.push('push'))
      originalNavigate.mockImplementation(() => callOrder.push('navigate'))
      originalReplace.mockImplementation(() => callOrder.push('replace'))

      onClosingTransitionStart()
      routerMock.push('/a')
      routerMock.navigate('/b')
      routerMock.replace('/c')

      expect(callOrder).toEqual([])

      onClosingTransitionEnd()

      expect(callOrder).toEqual(['push', 'navigate', 'replace'])
    })

    it('keeps queuing while multiple overlapping transitions are active', () => {
      onClosingTransitionStart()
      onClosingTransitionStart()
      routerMock.push('/home')

      onClosingTransitionEnd() // counter goes 2 → 1, still active
      expect(originalPush).not.toHaveBeenCalled()

      onClosingTransitionEnd() // counter goes 1 → 0, flush
      expect(originalPush).toHaveBeenCalledTimes(1)
    })
  })

  describe('failsafe timeout', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('auto-flushes the queue when onClosingTransitionEnd is never called', () => {
      onClosingTransitionStart()
      routerMock.push('/home')

      expect(originalPush).not.toHaveBeenCalled()

      jest.advanceTimersByTime(TRANSITION_FAILSAFE_MS)

      expect(originalPush).toHaveBeenCalledTimes(1)
      expect(originalPush).toHaveBeenCalledWith('/home', undefined)
    })

    it('does not double-flush when onClosingTransitionEnd is called before the failsafe fires', () => {
      onClosingTransitionStart()
      routerMock.push('/home')

      onClosingTransitionEnd() // normal path — flushes and cancels the timer
      expect(originalPush).toHaveBeenCalledTimes(1)

      jest.advanceTimersByTime(TRANSITION_FAILSAFE_MS) // cancelled timer must not fire again
      expect(originalPush).toHaveBeenCalledTimes(1)
    })

    it('only releases the missed transition when one of two overlapping transitions lacks an end', () => {
      onClosingTransitionStart() // transition A
      onClosingTransitionStart() // transition B
      routerMock.push('/home')

      onClosingTransitionEnd() // ends A normally, counter 2 → 1
      expect(originalPush).not.toHaveBeenCalled()

      jest.advanceTimersByTime(TRANSITION_FAILSAFE_MS) // failsafe for B fires, counter 1 → 0, flush
      expect(originalPush).toHaveBeenCalledTimes(1)
    })
  })

  describe('edge cases', () => {
    it('is a no-op when onClosingTransitionEnd is called without a matching start', () => {
      onClosingTransitionEnd() // counter is already 0, should not go negative
      routerMock.push('/home') // should still execute immediately
      expect(originalPush).toHaveBeenCalledTimes(1)
    })

    it('resumes normal (non-queued) behaviour after the transition ends', () => {
      onClosingTransitionStart()
      routerMock.push('/first')
      onClosingTransitionEnd()

      // flush happened; subsequent navigations should be immediate again
      routerMock.push('/second')
      expect(originalPush).toHaveBeenCalledTimes(2)
      expect(originalPush).toHaveBeenNthCalledWith(1, '/first', undefined)
      expect(originalPush).toHaveBeenNthCalledWith(2, '/second', undefined)
    })
  })
})

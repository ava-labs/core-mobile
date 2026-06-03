import { renderHook } from '@testing-library/react-hooks'
import { useInjectedJavascript } from './useInjectedJavascript'

type PostedMessage = { method: string; payload: string }

function runInjectedScript(
  script: string,
  windowImpl: Record<string, unknown>
): void {
  // The injected script references `window` directly. Run it as a function
  // expression that takes `window` as an argument so we don't have to leak the
  // mock into the global scope.
  // eslint-disable-next-line no-new-func
  new Function('window', script)(windowImpl)
}

describe('useInjectedJavascript', () => {
  describe('injectCustomWindowOpen', () => {
    let posted: PostedMessage[]
    let originalWindowOpen: jest.Mock
    let mockWindow: Record<string, unknown>

    beforeEach(() => {
      posted = []
      originalWindowOpen = jest.fn()
      mockWindow = {
        open: originalWindowOpen,
        ReactNativeWebView: {
          postMessage: (raw: string) =>
            posted.push(JSON.parse(raw) as PostedMessage)
        }
      }
    })

    const installScript = (): void => {
      const { result } = renderHook(() => useInjectedJavascript())
      runInjectedScript(result.current.injectCustomWindowOpen, mockWindow)
    }

    it('never calls the original window.open for http(s) URLs', () => {
      installScript()
      const openFn = mockWindow.open as (url: string) => unknown
      const ret = openFn('https://www.google.com/csi')

      expect(originalWindowOpen).not.toHaveBeenCalled()
      expect(ret).toBeNull()
    })

    it('posts a window_open message for http(s) URLs', () => {
      installScript()
      const openFn = mockWindow.open as (url: string) => unknown
      openFn('https://www.google.com/csi')

      expect(posted).toHaveLength(1)
      expect(posted[0]).toEqual({
        method: 'window_open',
        payload: 'https://www.google.com/csi'
      })
    })

    it('posts walletConnect_deeplink_blocked for core://wc?requestId URLs', () => {
      installScript()
      const openFn = mockWindow.open as (url: string) => unknown
      openFn('core://wc?requestId=abc&sessionTopic=xyz')

      expect(originalWindowOpen).not.toHaveBeenCalled()
      expect(posted).toHaveLength(1)
      expect(posted[0]?.method).toBe('walletConnect_deeplink_blocked')
    })

    it('ignores empty or non-string URLs without posting or calling open', () => {
      installScript()
      const openFn = mockWindow.open as (
        url?: string | null | number
      ) => unknown

      expect(openFn()).toBeNull()
      expect(openFn('')).toBeNull()
      expect(openFn(null)).toBeNull()
      expect(openFn(123)).toBeNull()

      expect(posted).toHaveLength(0)
      expect(originalWindowOpen).not.toHaveBeenCalled()
    })

    it('swallows errors from postMessage so the page is not crashed', () => {
      installScript()
      ;(
        mockWindow.ReactNativeWebView as { postMessage: jest.Mock }
      ).postMessage = jest.fn(() => {
        throw new Error('bridge failed')
      })
      const openFn = mockWindow.open as (url: string) => unknown
      expect(() => openFn('https://example.com')).not.toThrow()
      expect(originalWindowOpen).not.toHaveBeenCalled()
    })
  })
})

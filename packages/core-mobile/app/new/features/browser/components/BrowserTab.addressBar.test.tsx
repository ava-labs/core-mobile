/**
 * Address-bar / committed-origin binding tests for BrowserTab.
 *
 * These drive the real handlers through the WebView prop seam with the exact
 * native event sequences from the two address-bar spoofing directions:
 *
 *  - PENDING-URL: the bar must
 *    not advance to a URL that never commits.
 *  - STALE-URL: after a cross-origin navigation *has*
 *    committed, the bar must not keep showing the previous origin just because
 *    the new document never finishes loading (attacker holds a subresource
 *    open, so onPageFinished/didFinishNavigation never fires).
 */
import React from 'react'
import { act, create } from 'react-test-renderer'

const ATTACKER = 'https://attacker.example/'
const TRUSTED = 'https://metamask.io/'
const TAB_ID = 'tab-1'

// ---------------------------------------------------------------- capture seam
// Mocking ./Webview captures the navigation callbacks BrowserTab installs, so
// the test can fire native events at the real handlers.
let webViewProps: Record<string, (arg: unknown) => void> = {}

jest.mock('./Webview', () => ({
  WebView: (props: Record<string, (arg: unknown) => void>) => {
    webViewProps = props
    return null
  }
}))

// ------------------------------------------------------------------- app mocks
const mockSetUrlEntry = jest.fn()
const mockDispatch = jest.fn()
const mockHandleCommittedUrl = jest.fn()
const mockHandleProvisionalCrossOriginNavigation = jest.fn()

const mockTab = {
  id: TAB_ID,
  historyIds: ['h1'],
  activeHistoryIndex: 0,
  activeHistory: { id: 'h1', title: 'attacker', url: ATTACKER },
  lastVisited: 0
}

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  // Selectors below are mocked to be zero-arg thunks returning fixtures.
  useSelector: (selector: () => unknown) => selector()
}))

jest.mock('store/browser/slices/tabs', () => ({
  addHistoryForActiveTab: (p: unknown) => ({
    type: 'browser/addHistoryForActiveTab',
    payload: p
  }),
  addTab: () => ({ type: 'browser/addTab' }),
  goBackward: () => ({ type: 'browser/goBackward' }),
  goForward: () => ({ type: 'browser/goForward' }),
  goToDiscoverPage: () => ({ type: 'browser/goToDiscoverPage' }),
  updateActiveHistoryForTab: (p: unknown) => ({
    type: 'browser/updateActiveHistoryForTab',
    payload: p
  }),
  selectActiveTab: () => mockTab,
  selectTab: () => () => mockTab
}))

jest.mock('store/posthog/slice', () => ({
  selectIsInjectedProviderBlocked: () => false
}))

jest.mock('../BrowserContext', () => ({
  useBrowserContext: () => ({
    onProgress: jest.fn(),
    progress: 0,
    setUrlEntry: mockSetUrlEntry,
    // Not focused, so syncCommittedUrl is allowed to write the bar.
    inputRef: { current: { isFocused: () => false } }
  })
}))

jest.mock('hooks/browser/useEvmInjectedProvider', () => ({
  useEvmInjectedProvider: () => ({
    providerShimJs: '',
    handleProviderMessage: jest.fn(),
    handleDomainMetadata: jest.fn(),
    handleCommittedUrl: mockHandleCommittedUrl,
    handleProvisionalCrossOriginNavigation:
      mockHandleProvisionalCrossOriginNavigation
  })
}))

jest.mock('hooks/browser/useInjectedJavascript', () => ({
  useInjectedJavascript: () => ({
    injectCoreAsRecent: '',
    injectGetDescriptionAndFavicon: '',
    coreConnectInterceptor: '',
    injectCustomWindowOpen: '',
    injectCustomPrompt: '',
    injectGetPageStyles: ''
  }),
  GetDescriptionAndFavicon: 'GetDescriptionAndFavicon',
  GetPageStyles: 'GetPageStyles',
  InjectedJsMessageWrapper: {}
}))

jest.mock('hooks/browser/messageFrameInfo', () => ({
  getMessageFrameInfo: () => ({ isMainFrame: true, frameOrigin: ATTACKER })
}))

jest.mock('hooks/useClipboardWatcher', () => ({
  __esModule: true,
  default: () => ''
}))

jest.mock('contexts/DeeplinkContext/DeeplinkContext', () => ({
  useDeeplink: () => ({ setPendingDeepLink: jest.fn() })
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 })
}))

jest.mock('@avalabs/k2-alpine', () => {
  const rn = jest.requireActual('react-native')
  return {
    useTheme: () => ({ theme: { colors: {} } }),
    View: rn.View,
    showAlert: jest.fn()
  }
})

jest.mock('common/components/ErrorState', () => ({ ErrorState: () => null }))
jest.mock('common/components/LoadingState', () => ({
  LoadingState: () => null
}))
jest.mock('expo-image', () => ({ Image: () => null }))
jest.mock('utils/openInSystemBrowser', () => ({
  openInSystemBrowser: jest.fn()
}))
jest.mock('services/analytics/AnalyticsService', () => ({
  __esModule: true,
  default: { capture: () => Promise.resolve() }
}))
jest.mock('services/walletconnectv2/WalletConnectService', () => ({
  __esModule: true,
  default: { pair: jest.fn() }
}))
jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: { warn: jest.fn(), trace: jest.fn(), error: jest.fn() }
}))
jest.mock('react-native-webview', () => ({
  __esModule: true,
  default: () => null
}))

// eslint-disable-next-line import/first
import { BrowserTab } from './BrowserTab'

// ---------------------------------------------------------------- event helpers
const navEvent = (
  url: string,
  loading = false
): { nativeEvent: Record<string, unknown> } => ({
  nativeEvent: {
    url,
    title: url,
    loading,
    canGoBack: true,
    canGoForward: false,
    navigationType: 'other'
  }
})

/** Android onPageCommitVisible / iOS didCommitNavigation. */
const fireCommit = (url: string): void => {
  act(() => {
    webViewProps.onCommit?.(navEvent(url))
  })
}

/** Android onPageFinished / iOS didFinishNavigation. */
const fireLoad = (url: string): void => {
  act(() => {
    webViewProps.onLoad?.(navEvent(url))
  })
}

/** iOS provisional navigation / Android doUpdateVisitedHistory. */
const fireNavStateChange = (url: string): void => {
  act(() => {
    webViewProps.onNavigationStateChange?.({
      url,
      title: url,
      loading: true,
      canGoBack: true,
      canGoForward: false
    })
  })
}

const lastUrlEntry = (): string | undefined => {
  const calls = mockSetUrlEntry.mock.calls
  return calls.length ? (calls[calls.length - 1]?.[0] as string) : undefined
}

describe('BrowserTab address-bar binding', () => {
  // The provisional overlay arms a 10s deadline; keep it off the real clock so
  // it cannot fire after the test has finished.
  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    webViewProps = {}
    act(() => {
      create(<BrowserTab tabId={TAB_ID} />)
    })
    // Establish the attacker page as the committed document, then navigate to
    // the trusted origin and let it fully commit + load.
    fireCommit(ATTACKER)
    fireNavStateChange(TRUSTED)
    fireCommit(TRUSTED)
    fireLoad(TRUSTED)
    expect(lastUrlEntry()).toBe(TRUSTED)
    mockSetUrlEntry.mockClear()
  })

  it('Ensure that the attacker document moves the bar off the trusted origin at commit, without any load event', () => {
    // User presses Back. The attacker document is restored and commits, but its
    // /__hold.js subresource never completes, so onLoad/onPageFinished never
    // fires for it.
    fireNavStateChange(ATTACKER)
    fireCommit(ATTACKER)
    // Deliberately NO fireLoad(ATTACKER) — that is the whole exploit.

    expect(lastUrlEntry()).toBe(ATTACKER)
  })

  it('Ensure that the provider origin tracker also leaves the trusted origin at commit', () => {
    fireNavStateChange(ATTACKER)
    fireCommit(ATTACKER)

    expect(mockHandleCommittedUrl).toHaveBeenLastCalledWith(ATTACKER)
  })

  it('Ensure that no commit event the bar would stay on the trusted origin (the pre-fix behaviour)', () => {
    // Models origin/main, where onLoad was the only cross-origin writer: the
    // restored document is rendered and interactive but never "finishes", so
    // nothing ever moved the bar. This is the bug being fixed.
    fireNavStateChange(ATTACKER)

    expect(mockSetUrlEntry).not.toHaveBeenCalled()
  })

  // ------------------------------------------------ pending-URL regression
  it('Check regression: a cross-origin URL that never commits must not reach the bar', () => {
    // Attacker advances the URL to a host that hangs; no commit ever happens.
    fireNavStateChange('https://apple.com:9090/')

    expect(mockSetUrlEntry).not.toHaveBeenCalled()
  })

  it('Check regression: onLoad alone must not advance the bar cross-origin', () => {
    // window.stop()/204 navigations still fire onPageFinished. onLoad must
    // refuse to move the bar across origins.
    fireNavStateChange('https://apple.com/')
    fireLoad('https://apple.com/')

    expect(mockSetUrlEntry).not.toHaveBeenCalled()
  })

  it('same-origin SPA navigation still updates the bar', () => {
    fireNavStateChange(`${TRUSTED}dashboard`)

    expect(lastUrlEntry()).toBe(`${TRUSTED}dashboard`)
  })
})

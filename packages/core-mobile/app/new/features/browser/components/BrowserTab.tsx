import { showAlert, useTheme, View } from '@avalabs/k2-alpine'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { useDeeplink } from 'contexts/DeeplinkContext/DeeplinkContext'
import {
  DeepLink,
  DeepLinkOrigin,
  PROTOCOLS
} from 'contexts/DeeplinkContext/types'
import { Image } from 'expo-image'
import {
  GetDescriptionAndFavicon,
  GetPageStyles,
  InjectedJsMessageWrapper,
  useInjectedJavascript
} from 'hooks/browser/useInjectedJavascript'
import useClipboardWatcher from 'hooks/useClipboardWatcher'
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import RNWebView, {
  WebViewMessageEvent,
  WebViewNavigation,
  WebViewNavigationEvent
} from 'react-native-webview'
import { WebViewErrorEvent } from 'react-native-webview/lib/WebViewTypes'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import {
  addHistoryForActiveTab,
  goBackward,
  goForward as goForwardAction,
  goToDiscoverPage,
  selectActiveTab,
  selectTab,
  updateActiveHistoryForTab
} from 'store/browser/slices/tabs'
import Logger from 'utils/Logger'
import ErrorIcon from '../../../assets/icons/melting_face.png'
import { useBrowserContext } from '../BrowserContext'
import { WebView } from './Webview'

export interface BrowserTabRef {
  loadUrl: (url: string) => void
  reload: () => void
  goBack: () => void
  goForward: () => void
  getPageData: () => {
    favicon: string | undefined
    description: string
  }
}

export const BrowserTab = forwardRef<BrowserTabRef, { tabId: string }>(
  // eslint-disable-next-line sonarjs/cognitive-complexity
  ({ tabId }, ref): JSX.Element => {
    const dispatch = useDispatch()
    const { theme } = useTheme()
    const insets = useSafeAreaInsets()

    const { onProgress, progress, setUrlEntry, inputRef } = useBrowserContext()
    const { setPendingDeepLink } = useDeeplink()
    const clipboard = useClipboardWatcher()
    const {
      injectCoreAsRecent,
      injectGetDescriptionAndFavicon,
      coreConnectInterceptor,
      injectCustomWindowOpen,
      injectCustomPrompt,
      injectGetPageStyles
    } = useInjectedJavascript()

    const injectedJavascript =
      injectGetDescriptionAndFavicon +
      injectGetPageStyles +
      injectCoreAsRecent +
      coreConnectInterceptor +
      injectCustomWindowOpen +
      injectCustomPrompt

    const activeTab = useSelector(selectActiveTab)
    const tab = useSelector(selectTab(tabId))
    const activeHistory = tab?.activeHistory
    const activeHistoryUrl = activeHistory?.url ?? ''
    const disabled = activeTab?.id !== tabId

    const [urlToLoad, setUrlToLoad] = useState(
      activeHistoryUrl.length > 0 ? activeHistoryUrl : ''
    )
    const [error, setError] = useState<unknown | undefined>(undefined)

    const lastNavStateRef = useRef<{
      url: string
      canGoBack: boolean
      canGoForward: boolean
    }>({
      url: '',
      canGoBack: false,
      canGoForward: false
    })
    const lastSyncedUrlRef = useRef<string>('')
    const backAttemptUrlRef = useRef<string | null>(null)
    const backAttemptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
      null
    )

    const [favicon, setFavicon] = useState<string | undefined>(undefined)
    const [description, setDescription] = useState('')
    const [pageStyles, setPageStyles] = useState<GetPageStyles | undefined>(
      undefined
    )

    const webViewRef = useRef<RNWebView | null>(null)
    const backgroundColor =
      pageStyles?.backgroundColor || theme.colors.$surfacePrimary

    useEffect(() => {
      // Only update the URL to load when the navigation was initiated externally
      // For swipe/back/forward inside the WebView, we let WebView navigate and
      // only *sync Redux* from navigation events to avoid reload loops.
      const next = activeHistory?.url ?? ''
      if (!next.length) {
        lastNavStateRef.current = {
          url: '',
          canGoBack: false,
          canGoForward: false
        }
      }

      // Always keep `urlToLoad` in sync with redux. Skip only when already equal.
      if (next !== urlToLoad) {
        setUrlToLoad(next)
      }
    }, [activeHistory?.url, urlToLoad])

    useEffect(() => {
      //initiate deep link if user copies WC link to clipboard
      if (clipboard.startsWith('wc:')) {
        setPendingDeepLink({
          url: clipboard,
          origin: DeepLinkOrigin.ORIGIN_QR_CODE
        } as DeepLink)
      }
    }, [clipboard, setPendingDeepLink])

    const reload = (): void => {
      webViewRef.current?.reload()
    }

    const goToDiscover = useCallback((): void => {
      if (!tab?.id) return

      dispatch(goToDiscoverPage())

      // Keep local/UI state consistent immediately.
      lastNavStateRef.current = {
        url: '',
        canGoBack: false,
        canGoForward: false
      }
      backAttemptUrlRef.current = null
      if (backAttemptTimerRef.current) {
        clearTimeout(backAttemptTimerRef.current)
        backAttemptTimerRef.current = null
      }
      setUrlToLoad('')
      // urlEntry is synced from redux in BrowserContext when activeHistory becomes undefined
    }, [dispatch, tab?.id])

    const goBack = (): void => {
      AnalyticsService.capture('BrowserBackTapped').catch(Logger.error)
      if (lastNavStateRef.current.canGoBack) {
        // Some sites report canGoBack but effectively "no-op" on back.
        // We attempt WebView back first, but if no navigation happens shortly after, fall back to Discover page.
        const urlAtAttempt = lastNavStateRef.current.url
        backAttemptUrlRef.current = urlAtAttempt
        if (backAttemptTimerRef.current) {
          clearTimeout(backAttemptTimerRef.current)
        }

        webViewRef.current?.goBack()

        backAttemptTimerRef.current = setTimeout(() => {
          // If the URL didn't change after the attempt, treat it as a no-op and display Discover page.
          if (lastNavStateRef.current.url === urlAtAttempt) {
            goToDiscover()
          }
        }, 1000)
        return
      }

      // When WebView can't go back, fallback to our Redux history stack.
      if (!tab?.id) return

      dispatch(goBackward())
    }

    const goForward = (): void => {
      AnalyticsService.capture('BrowserForwardTapped').catch(Logger.error)
      if (lastNavStateRef.current.canGoForward) {
        webViewRef.current?.goForward()
        return
      }

      // WebView can't go forward, fallback to our Redux history stack.
      if (!tab?.id) return
      dispatch(goForwardAction())
    }

    useImperativeHandle(ref, () => ({
      loadUrl: (url: string) => {
        setUrlToLoad(url)
      },
      reload,
      goBack,
      goForward,
      getPageData
    }))

    const getPageData = (): {
      favicon: string | undefined
      description: string
    } => {
      return {
        favicon,
        description
      }
    }

    const parseDescriptionAndFavicon = useCallback(
      (wrapper: InjectedJsMessageWrapper, _: WebViewMessageEvent) => {
        try {
          const { favicon: favi, description: desc } = JSON.parse(
            wrapper.payload
          ) as GetDescriptionAndFavicon

          if (favi || desc) {
            const icon = activeHistory?.favicon
              ? activeHistory?.favicon
              : favi === 'null'
              ? undefined
              : favi
            setFavicon(icon)
            setDescription(desc)
            activeTab &&
              activeTab.activeHistory &&
              dispatch(
                updateActiveHistoryForTab({
                  id: activeTab.id,
                  activeHistoryIndex: activeTab.activeHistoryIndex,
                  activeHistory: {
                    ...activeTab.activeHistory,
                    favicon: icon,
                    description: desc
                  }
                })
              )
          }
        } catch (e) {
          Logger.error('WebView onMessage error', e)
        }
      },
      [dispatch, activeTab, activeHistory]
    )

    const parsePageStyles = useCallback(
      (wrapper: InjectedJsMessageWrapper, _: WebViewMessageEvent) => {
        try {
          const styles = JSON.parse(wrapper.payload) as GetPageStyles
          if (styles) {
            setPageStyles(styles)
          }
        } catch (e) {
          Logger.error('WebView onMessage error', e)
        }
      },
      []
    )

    const showWalletConnectDialog = useCallback(() => {
      showAlert({
        title: 'Use Wallet Connect ',
        description:
          'Core uses Wallet Connect on mobile devices. Return to the dApp and tap the Wallet Connect option to continue.',
        buttons: [{ text: 'Got it' }]
      })
    }, [])

    const onMessageHandler = useCallback(
      (event: WebViewMessageEvent) => {
        try {
          const wrapper = JSON.parse(
            event.nativeEvent.data
          ) as InjectedJsMessageWrapper
          switch (wrapper.method) {
            case 'page_styles':
              parsePageStyles(wrapper, event)
              break
            case 'desc_and_favicon':
              parseDescriptionAndFavicon(wrapper, event)
              break
            case 'window_ethereum_used': {
              const sessions = WalletConnectService.getSessions()
              if (
                sessions.find(session =>
                  urlToLoad.startsWith(session.peer.metadata.url)
                ) === undefined
              ) {
                showWalletConnectDialog()
              }
              break
            }
            case 'log':
              Logger.trace('------> wrapper.payload', wrapper.payload)
              break
            case 'walletConnect_deeplink_blocked':
              Logger.info(
                'walletConnect_deeplink_blocked, url: ',
                wrapper.payload
              )
              break
            default:
              break
          }
        } catch (e) {
          Logger.error('WebView onMessage error', e)
        }

        //do not remove this listener, https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md#injectedjavascript
        Logger.trace('WebView onMessage')
      },
      [
        parseDescriptionAndFavicon,
        parsePageStyles,
        showWalletConnectDialog,
        urlToLoad
      ]
    )

    const onLoad = (event: WebViewNavigationEvent): void => {
      if (
        event.nativeEvent.url.startsWith('about:') ||
        event.nativeEvent.loading
      )
        return

      if (error) {
        setError(undefined)
      }

      // `onNavigationStateChange` is the single source of truth for history sync.
      // Avoid double-dispatching history updates (can cause unnecessary rerenders/loops).
    }

    const onNavigationStateChange = (navState: WebViewNavigation): void => {
      if (disabled) return

      // Update last nav-state *before* any filtering, so we can detect "no-op back" attempts.
      lastNavStateRef.current = {
        url: navState.url ?? '',
        canGoBack: navState.canGoBack,
        canGoForward: navState.canGoForward
      }

      const nextUrl = navState.url
      if (!nextUrl?.length || nextUrl.startsWith('about:')) return

      // Sync once per URL. WebView (especially with swipe / SPAs / redirects) can emit multiple
      // navigation state changes for the same URL; gating by `loading === false` can miss updates
      // because the URL often changes while loading=true and then settles without another URL change.
      if (lastSyncedUrlRef.current !== nextUrl) {
        lastSyncedUrlRef.current = nextUrl

        // Keep Redux history aligned with the actual WebView navigation stack
        dispatch(
          addHistoryForActiveTab({
            title: navState.title ?? nextUrl,
            url: nextUrl
          })
        )

        // Only update the input value if the user isn't actively typing.
        if (!inputRef?.current?.isFocused()) {
          setUrlEntry(nextUrl)
        }
      }

      // Cancel pending "no-op back" fallback only when the URL actually changes.
      const attemptUrl = backAttemptUrlRef.current
      if (attemptUrl && attemptUrl !== nextUrl) {
        backAttemptUrlRef.current = null
        if (backAttemptTimerRef.current) {
          clearTimeout(backAttemptTimerRef.current)
          backAttemptTimerRef.current = null
        }
      }
    }

    useEffect(() => {
      return () => {
        if (backAttemptTimerRef.current) {
          clearTimeout(backAttemptTimerRef.current)
          backAttemptTimerRef.current = null
        }
      }
    }, [])

    const isDeepLinkUrl = (url: string): boolean => {
      const lower = url.toLowerCase()
      return (
        lower.startsWith(`${PROTOCOLS.CORE}://`) ||
        lower.startsWith(`${PROTOCOLS.WC}:`)
      )
    }

    const onError = (event: WebViewErrorEvent): void => {
      // Fallback: unknown schemes can sometimes reach `onError` without triggering
      // `onShouldStartLoadWithRequest` (depending on redirect/navigation type).
      const failedUrl = event.nativeEvent.url ?? ''
      const description = event.nativeEvent.description ?? ''

      if (
        description.includes('ERR_UNKNOWN_URL_SCHEME') &&
        isDeepLinkUrl(failedUrl)
      ) {
        setPendingDeepLink({
          url: failedUrl,
          origin: DeepLinkOrigin.ORIGIN_IN_APP_BROWSER
        } as DeepLink)
        // Try to recover the tab UI by returning to the previous/discover page instead of showing an error screen.
        if (lastNavStateRef.current.canGoBack) {
          webViewRef.current?.goBack()
        } else {
          goToDiscover()
        }
        return
      }

      progress.value = 0
      setError(event.nativeEvent)
    }

    const onShouldStartLoadWithRequest = useCallback(
      (request: WebViewNavigation): boolean => {
        if (disabled) return false

        const nextUrl = request.url ?? ''
        if (!nextUrl.length) return true

        // WebView cannot load custom schemes (e.g. `core://`, `wc:`) and will throw
        // `net::ERR_UNKNOWN_URL_SCHEME`. Intercept these navigations and route through the
        // existing Deeplink flow.
        if (isDeepLinkUrl(nextUrl)) {
          setPendingDeepLink({
            url: nextUrl,
            origin: DeepLinkOrigin.ORIGIN_IN_APP_BROWSER
          } as DeepLink)
          return false
        }

        return true
      },
      [disabled, setPendingDeepLink]
    )

    const renderLoading = (): JSX.Element => {
      return (
        <LoadingState
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            backgroundColor: theme.colors.$surfacePrimary
          }}
        />
      )
    }

    return (
      <View style={{ flex: 1 }}>
        {/* Main content */}
        {error ? (
          <ErrorState
            sx={{ flex: 1, paddingTop: insets.top, backgroundColor }}
            icon={
              <Image
                source={ErrorIcon}
                style={{ width: 42, height: 42 }}
                renderToHardwareTextureAndroid={false}
              />
            }
            title={'Failed to load'}
            description={'Please hit refresh or try again later'}
            button={{
              title: 'Refresh',
              onPress: () => {
                setError(undefined)
                reload()
              }
            }}
          />
        ) : !urlToLoad?.length ? (
          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.$surfacePrimary
            }}
          />
        ) : (
          <WebView
            key={tabId}
            testID="myWebview"
            webViewRef={webViewRef}
            injectedJavaScript={injectedJavascript}
            url={urlToLoad}
            onLoad={onLoad}
            onNavigationStateChange={onNavigationStateChange}
            onMessage={onMessageHandler}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            nestedScrollEnabled
            pullToRefreshEnabled
            allowsBackForwardNavigationGestures
            style={{
              backgroundColor
            }}
            renderLoading={renderLoading}
            containerStyle={{
              paddingTop: insets.top
            }}
            onLoadProgress={onProgress}
            onError={onError}
          />
        )}
      </View>
    )
  }
)

import { showAlert, useTheme, View } from '@avalabs/k2-alpine'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { useDeeplink } from 'contexts/DeeplinkContext/DeeplinkContext'
import { DeepLink, DeepLinkOrigin } from 'contexts/DeeplinkContext/types'
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
  WebViewNavigationEvent
} from 'react-native-webview'
import { WebViewErrorEvent } from 'react-native-webview/lib/WebViewTypes'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { AddHistoryPayload } from 'store/browser'
import {
  addHistoryForActiveTab,
  goBackward,
  goForward as goForwardInPage,
  selectActiveTab,
  selectCanGoBack,
  selectCanGoForward,
  updateActiveHistoryForTab
} from 'store/browser/slices/tabs'
import Logger from 'utils/Logger'
import ErrorIcon from '../../../assets/icons/melting_face.png'
import { useBrowserContext } from '../BrowserContext'
import { isSuggestedSiteName } from '../utils'
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

    const { onProgress, progress, setUrlEntry } = useBrowserContext()
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

    const canGoBack = useSelector(selectCanGoBack)
    const canGoForward = useSelector(selectCanGoForward)
    const activeTab = useSelector(selectActiveTab)
    const activeHistory = activeTab?.activeHistory
    const activeHistoryUrl = activeHistory?.url ?? ''
    const disabled = activeTab?.id !== tabId

    const [urlToLoad, setUrlToLoad] = useState(activeHistoryUrl)
    const [error, setError] = useState<unknown | undefined>(undefined)

    const [favicon, setFavicon] = useState<string | undefined>(undefined)
    const [description, setDescription] = useState('')
    const [pageStyles, setPageStyles] = useState<GetPageStyles | undefined>(
      undefined
    )

    const webViewRef = useRef<RNWebView>(null)
    const backgroundColor =
      pageStyles?.backgroundColor || theme.colors.$surfacePrimary

    useEffect(() => {
      try {
        const activeHistoryURL = activeHistory?.url
          ? new URL(activeHistory.url)
          : undefined
        const urlToLoadURL =
          urlToLoad.length > 0 ? new URL(urlToLoad) : undefined

        if (
          activeHistory?.url &&
          activeHistoryURL?.origin !== urlToLoadURL?.origin
        ) {
          setUrlToLoad(activeHistory.url)
        }
      } catch (e) {
        setError(e)
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

    const goBack = (): void => {
      if (!canGoBack) return
      AnalyticsService.capture('BrowserBackTapped').catch(Logger.error)
      dispatch(goBackward())
    }

    const goForward = (): void => {
      if (!canGoForward) return
      AnalyticsService.capture('BrowserForwardTapped').catch(Logger.error)
      dispatch(goForwardInPage())
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
        const { favicon: favi, description: desc } = JSON.parse(
          wrapper.payload
        ) as GetDescriptionAndFavicon

        if (favi || desc) {
          // if the favicon is already set to static favicon from suggested list, don't update it
          const icon = isSuggestedSiteName(activeHistory?.favicon)
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
      },
      [dispatch, activeTab, activeHistory]
    )

    const parsePageStyles = useCallback(
      (wrapper: InjectedJsMessageWrapper, _: WebViewMessageEvent) => {
        const styles = JSON.parse(wrapper.payload) as GetPageStyles
        if (styles) {
          setPageStyles(styles)
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
        event.nativeEvent.url.startsWith('about:blank') ||
        event.nativeEvent.loading
      )
        return

      if (error) {
        setError(undefined)
      }

      const includeDescriptionAndFavicon =
        description !== '' && favicon !== undefined
      const history: AddHistoryPayload = includeDescriptionAndFavicon
        ? {
            title: event.nativeEvent.title,
            url: event.nativeEvent.url,
            description,
            favicon
          }
        : { title: event.nativeEvent.title, url: event.nativeEvent.url }
      dispatch(addHistoryForActiveTab(history))
      setUrlEntry(event.nativeEvent.url)
    }

    const onError = (event: WebViewErrorEvent): void => {
      progress.value = 0
      setError(event.nativeEvent)
    }

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
        ) : (
          <WebView
            key={tabId}
            testID="myWebview"
            webViewRef={webViewRef}
            injectedJavaScript={injectedJavascript}
            url={urlToLoad}
            onLoad={onLoad}
            onMessage={onMessageHandler}
            onShouldStartLoadWithRequest={() => !disabled}
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

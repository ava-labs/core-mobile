import { showAlert, useTheme, View } from '@avalabs/k2-alpine'
import { ErrorState } from 'common/components/ErrorState'
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
import {
  WebViewError,
  WebViewErrorEvent
} from 'react-native-webview/lib/WebViewTypes'
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
    const [error, setError] = useState<WebViewError | undefined>(undefined)

    const [favicon, setFavicon] = useState<string | undefined>(undefined)
    const [description, setDescription] = useState('')
    const [pageStyles, setPageStyles] = useState<GetPageStyles | undefined>(
      undefined
    )

    const webViewRef = useRef<RNWebView>(null)
    const backgroundColor =
      pageStyles?.backgroundColor || theme.colors.$surfacePrimary

    useEffect(() => {
      if (activeHistory?.url && activeHistory.url !== urlToLoad) {
        setUrlToLoad(activeHistory.url)
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

    return (
      <View
        style={[
          {
            flex: 1,
            backgroundColor
          }
        ]}>
        {error ? (
          <ErrorState
            sx={{ flex: 1, paddingTop: insets.top }}
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
            style={{
              backgroundColor
            }}
            containerStyle={{
              paddingTop: insets.top
            }}
            contentInset={{
              bottom: 0
            }}
            onLoadProgress={onProgress}
            onError={onError}
            allowsBackForwardNavigationGestures
          />
        )}
      </View>
    )
  }
)

import { ANIMATED, useTheme } from '@avalabs/k2-alpine'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { useDeeplink } from 'contexts/DeeplinkContext/DeeplinkContext'
import { DeepLink, DeepLinkOrigin } from 'contexts/DeeplinkContext/types'
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
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import RNWebView, {
  WebViewMessageEvent,
  WebViewNavigationEvent
} from 'react-native-webview'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { AddHistoryPayload } from 'store/browser'
import {
  addHistoryForActiveTab,
  goBackward,
  goForward as goForwardInPage,
  selectCanGoBack,
  selectCanGoForward,
  selectTab,
  updateActiveHistoryForTab
} from 'store/browser/slices/tabs'
import Logger from 'utils/Logger'
import { useBrowserContext } from '../BrowserContext'
import { BROWSER_CONTROLS_HEIGHT } from '../consts'
import { isSugguestedSiteName } from '../utils'
import { WebView } from './Webview'

export interface BrowserTabRef {
  loadUrl: (url: string) => void
  reload: () => void
  goBack: () => void
  goForward: () => void
}

export const BrowserTab = forwardRef<
  BrowserTabRef,
  { tabId: string; disabled: boolean }
>(({ tabId, disabled }, ref): JSX.Element => {
  const dispatch = useDispatch()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const tabBarHeight = useBottomTabBarHeight()

  const { onProgress, progress, setUrlEntry, urlEntry } = useBrowserContext()
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

  const activeTab = useSelector(selectTab(tabId))
  const activeHistory = activeTab?.activeHistory
  const activeHistoryUrl = activeHistory?.url ?? ''

  const [urlToLoad, setUrlToLoad] = useState(activeHistoryUrl)
  const [favicon, setFavicon] = useState<string | undefined>(undefined)
  const [description, setDescription] = useState('')
  const [pageStyles, setPageStyles] = useState<GetPageStyles | undefined>(
    undefined
  )

  const webViewRef = useRef<RNWebView>(null)
  const backgroundColor =
    pageStyles?.backgroundColor || theme.colors.$surfacePrimary

  const canGoBack = useSelector(selectCanGoBack)
  const canGoForward = useSelector(selectCanGoForward)

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
    goForward
  }))

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

  const parseDescriptionAndFavicon = useCallback(
    (wrapper: InjectedJsMessageWrapper, _: WebViewMessageEvent) => {
      const { favicon: favi, description: desc } = JSON.parse(
        wrapper.payload
      ) as GetDescriptionAndFavicon
      if (favi || desc) {
        // if the favicon is already set to static favicon from suggested list, don't update it
        const icon = isSugguestedSiteName(activeHistory?.favicon)
          ? activeHistory?.favicon
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
    // TODO: Not sure if we want this?
    // navigate(AppNavigation.Modal.UseWalletConnect, {
    //   onContinue: () => {
    //     //noop, for now
    //   }
    // })
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
          Logger.info('walletConnect_deeplink_blocked, url: ', wrapper.payload)
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

  const onError = (): void => {
    progress.value = 0
  }

  const wrapperStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(
        activeTab?.id === tabId ? 1 : 0,
        ANIMATED.TIMING_CONFIG
      )
    }
  })

  return (
    <Animated.View
      style={[
        wrapperStyle,
        {
          flex: 1,
          backgroundColor
        }
      ]}>
      <WebView
        key={tabId}
        testID="myWebview"
        webViewRef={webViewRef}
        injectedJavaScript={
          injectGetDescriptionAndFavicon +
          injectGetPageStyles +
          injectCoreAsRecent +
          coreConnectInterceptor +
          injectCustomWindowOpen +
          injectCustomPrompt
        }
        url={urlToLoad}
        onLoad={onLoad}
        onMessage={onMessageHandler}
        onShouldStartLoadWithRequest={() => !disabled}
        style={{
          paddingTop: insets.top,
          backgroundColor
        }}
        contentInset={{
          bottom: BROWSER_CONTROLS_HEIGHT + tabBarHeight
        }}
        onLoadProgress={onProgress}
        onError={onError}
      />
    </Animated.View>
  )
})

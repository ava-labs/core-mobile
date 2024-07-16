import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Icons, View } from '@avalabs/k2-mobile'
import WebView, { WebViewMessageEvent } from 'react-native-webview'
import Logger from 'utils/Logger'
import { useDispatch, useSelector } from 'react-redux'
import {
  addHistoryForActiveTab,
  goBackward,
  goForward as goForwardInPage,
  selectAllTabs,
  selectCanGoBack,
  selectCanGoForward,
  selectTab
} from 'store/browser/slices/tabs'
import { useDeeplink } from 'contexts/DeeplinkContext/DeeplinkContext'
import { DeepLink, DeepLinkOrigin } from 'contexts/DeeplinkContext/types'
import { AddHistoryPayload } from 'store/browser'
import InputText from 'components/InputText'
import useClipboardWatcher from 'hooks/useClipboardWatcher'
import {
  GetDescriptionAndFavicon,
  InjectedJsMessageWrapper,
  useInjectedJavascript
} from 'hooks/browser/useInjectedJavascript'
import { useGoogleSearch } from 'hooks/browser/useGoogleSearch'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { BrowserScreenProps } from 'navigation/types'
import { selectIsFavorited } from 'store/browser/slices/favorites'
import { LayoutAnimation } from 'react-native'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { updateMetadataForActiveTab } from 'store/browser/slices/globalHistory'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import {
  isValidHttpUrl,
  normalizeUrlWithHttps,
  removeTrailingSlash
} from './utils'
import { TabIcon } from './components/TabIcon'
import { MoreMenu } from './components/MoreMenu'
import NavButton from './components/NavButton'

type TabViewNavigationProp = BrowserScreenProps<
  typeof AppNavigation.Browser.TabView
>['navigation']

export default function Browser({ tabId }: { tabId: string }): JSX.Element {
  const dispatch = useDispatch()
  const { setPendingDeepLink } = useDeeplink()
  const [urlEntry, setUrlEntry] = useState('')
  const [urlToLoad, setUrlToLoad] = useState('')
  const clipboard = useClipboardWatcher()
  const {
    injectCoreAsRecent,
    injectGetDescriptionAndFavicon,
    coreConnectInterceptor,
    injectCustomWindowOpen
  } = useInjectedJavascript()
  const activeHistory = useSelector(selectTab(tabId))?.activeHistory
  const webViewRef = useRef<WebView>(null)
  const [favicon, setFavicon] = useState<string | undefined>(undefined)
  const [description, setDescription] = useState('')
  const { navigateToGoogleSearchResult } = useGoogleSearch()
  const totalTabs = useSelector(selectAllTabs).length
  const canGoBack = useSelector(selectCanGoBack)
  const canGoForward = useSelector(selectCanGoForward)
  const { navigate } = useNavigation<TabViewNavigationProp>()
  const [urlBarFocused, setUrlBarFocused] = useState(false)
  const isFavorited = useSelector(selectIsFavorited(activeHistory?.id))

  const goBack = (): void => {
    if (!canGoBack) return
    AnalyticsService.capture('BrowserBackTapped')
    dispatch(goBackward())
  }
  const goForward = (): void => {
    if (!canGoForward) return
    AnalyticsService.capture('BrowserForwardTapped')
    dispatch(goForwardInPage())
  }

  const navigateToTabList = (): void => {
    AnalyticsService.capture('BrowserTabsOpened').catch(Logger.error)
    navigate(AppNavigation.Modal.BrowserTabsList)
  }

  function handleUrlSubmit(): void {
    AnalyticsService.capture('BrowserSearchSubmitted').catch(Logger.error)
    const normalized = normalizeUrlWithHttps(urlEntry)
    if (isValidHttpUrl(normalized)) {
      setUrlToLoad(normalized)
    } else {
      navigateToGoogleSearchResult(normalized)
    }
  }

  useEffect(() => {
    if (
      activeHistory?.url &&
      removeTrailingSlash(urlEntry) !== removeTrailingSlash(activeHistory.url)
    ) {
      setUrlToLoad(activeHistory.url)
    }
  }, [activeHistory?.url, urlEntry])

  useEffect(() => {
    //initiate deep link if user copies WC link to clipboard
    if (clipboard.startsWith('wc:')) {
      setPendingDeepLink({
        url: clipboard,
        origin: DeepLinkOrigin.ORIGIN_QR_CODE
      } as DeepLink)
    }
  }, [clipboard, setPendingDeepLink])

  function handleRefresh(): void {
    webViewRef.current?.reload()
  }

  const parseDescriptionAndFavicon = useCallback(
    (wrapper: InjectedJsMessageWrapper, event: WebViewMessageEvent) => {
      const { favicon: favi, description: desc } = JSON.parse(
        wrapper.payload
      ) as GetDescriptionAndFavicon
      if (favi || desc) {
        setFavicon(favi)
        setDescription(desc)
        dispatch(
          updateMetadataForActiveTab({
            url: event.nativeEvent.url,
            favicon: favi,
            description: desc
          })
        )
      }
    },
    [dispatch]
  )

  const showWalletConnectDialog = useCallback(() => {
    navigate(AppNavigation.Modal.UseWalletConnect, {
      onContinue: () => {
        //noop, for now
      }
    })
  }, [navigate])

  const onMessageHandler = useCallback(
    (event: WebViewMessageEvent) => {
      const wrapper = JSON.parse(
        event.nativeEvent.data
      ) as InjectedJsMessageWrapper
      switch (wrapper.method) {
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
    [parseDescriptionAndFavicon, showWalletConnectDialog, urlToLoad]
  )

  return (
    <View style={{ width: '100%', height: '100%' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginLeft: 4
        }}>
        <InputText
          mode={'url'}
          onRefresh={handleRefresh}
          text={urlEntry}
          autoCorrect={false}
          onChangeText={setUrlEntry}
          onSubmit={handleUrlSubmit}
          onBlur={() => {
            LayoutAnimation.easeInEaseOut()
            setUrlBarFocused(false)
          }}
          onFocus={() => {
            LayoutAnimation.easeInEaseOut()
            setUrlBarFocused(true)
          }}
          style={{ width: urlBarFocused ? '93%' : '45%' }}
        />
        <View
          style={{
            flexDirection: 'row',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'space-between',
            marginRight: 12,
            marginLeft: 6
          }}>
          <NavButton
            Icon={Icons.Navigation.ArrowBack}
            onPress={goBack}
            disabled={!canGoBack}
          />
          <NavButton
            Icon={Icons.Navigation.ArrowForward}
            onPress={goForward}
            disabled={!canGoForward}
          />
          <TabIcon numberOfTabs={totalTabs} onPress={navigateToTabList} />
          <MoreMenu isFavorited={isFavorited}>
            <NavButton
              Icon={Icons.Navigation.MoreVert}
              onPress={() => {
                AnalyticsService.capture('BrowserContextualMenuOpened')
              }}
            />
          </MoreMenu>
        </View>
      </View>
      <WebView
        allowsInlineMediaPlayback={true}
        javaScriptEnabled={true}
        testID="myWebview"
        ref={webViewRef}
        pullToRefreshEnabled={true}
        injectedJavaScript={
          injectGetDescriptionAndFavicon +
          injectCoreAsRecent +
          coreConnectInterceptor +
          injectCustomWindowOpen
        }
        source={{ uri: urlToLoad }}
        setSupportMultipleWindows={false}
        onError={event => {
          Logger.error('WebView onError', event.nativeEvent.description)
        }}
        onLoadEnd={() => {
          Logger.trace('------> onLoadEnd')
        }}
        onLoad={event => {
          if (event.nativeEvent.url.startsWith('about:blank')) return
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
        }}
        onMessage={onMessageHandler}
      />
    </View>
  )
}

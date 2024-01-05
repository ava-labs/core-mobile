import React, { useEffect, useRef, useState } from 'react'
import { View } from '@avalabs/k2-mobile'
import WebView from 'react-native-webview'
import Logger from 'utils/Logger'
import { useDispatch, useSelector } from 'react-redux'
import { addHistoryForActiveTab, selectTab } from 'store/browser/slices/tabs'
import { useDeeplink } from 'contexts/DeeplinkContext/DeeplinkContext'
import { DeepLink, DeepLinkOrigin } from 'contexts/DeeplinkContext/types'
import { AddHistoryPayload } from 'store/browser'
import InputText from 'components/InputText'
import useClipboardWatcher from 'hooks/useClipboardWatcher'
import useScrollHandler, { ScrollState } from 'hooks/browser/useScrollHandler'
import useRecentWalletHack, {
  GetDescriptionAndFavicon
} from 'hooks/browser/useInjectedJavascript'
import { useAnalytics } from 'hooks/useAnalytics'
import { updateMetadataForActiveTab } from 'store/browser/slices/globalHistory'
import { useGoogleSearch } from 'hooks/browser/useGoogleSearch'
import { isValidHttpUrl, normalizeUrlWithHttps } from './utils'

export default function Browser({
  tabId,
  onNewScrollState
}: {
  tabId: string
  onNewScrollState: (scrollState: ScrollState) => void
}): JSX.Element {
  const dispatch = useDispatch()
  const { setPendingDeepLink } = useDeeplink()
  const [urlEntry, setUrlEntry] = useState('')
  const [urlToLoad, setUrlToLoad] = useState('')
  const clipboard = useClipboardWatcher()
  const { scrollState, onScrollHandler } = useScrollHandler()
  const { injectCoreAsRecent, injectGetDescriptionAndFavicon } =
    useRecentWalletHack()
  const activeHistory = useSelector(selectTab(tabId))?.activeHistory
  const webViewRef = useRef<WebView>(null)
  const [favicon, setFavicon] = useState<string | undefined>(undefined)
  const { capture } = useAnalytics()
  const [description, setDescription] = useState('')
  const { navigateToGoogleSearchResult } = useGoogleSearch()

  function handleUrlSubmit(): void {
    capture('BrowserSearchSubmitted')
    const normalized = normalizeUrlWithHttps(urlEntry)
    if (isValidHttpUrl(normalized)) {
      setUrlToLoad(normalized)
    } else {
      navigateToGoogleSearchResult(normalized)
    }
  }

  useEffect(() => {
    activeHistory?.url && setUrlToLoad(activeHistory.url)
  }, [activeHistory?.url])

  useEffect(() => {
    onNewScrollState(scrollState)
  }, [onNewScrollState, scrollState])

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

  return (
    <View style={{ width: '100%', height: '100%' }}>
      <InputText
        mode={'url'}
        onRefresh={handleRefresh}
        text={urlEntry}
        autoCorrect={false}
        onChangeText={setUrlEntry}
        onSubmit={handleUrlSubmit}
      />
      <WebView
        ref={webViewRef}
        pullToRefreshEnabled={true}
        injectedJavaScript={injectGetDescriptionAndFavicon + injectCoreAsRecent}
        source={{ uri: urlToLoad }}
        setSupportMultipleWindows={false}
        onScroll={onScrollHandler}
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
        onMessage={event => {
          const parsedJson = JSON.parse(
            event.nativeEvent.data
          ) as GetDescriptionAndFavicon

          if (parsedJson.favicon || parsedJson.description) {
            setFavicon(parsedJson.favicon)
            setDescription(parsedJson.description)
            dispatch(
              updateMetadataForActiveTab({
                url: event.nativeEvent.url,
                favicon: parsedJson.favicon,
                description: parsedJson.description
              })
            )
          }

          //do not remove this listener, https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md#injectedjavascript
          Logger.trace('WebView onMessage')
        }}
      />
    </View>
  )
}

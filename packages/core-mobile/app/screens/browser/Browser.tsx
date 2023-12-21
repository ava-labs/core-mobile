import React, { useEffect, useRef, useState } from 'react'
import { View } from '@avalabs/k2-mobile'
import WebView from 'react-native-webview'
import Logger from 'utils/Logger'
import { useDispatch, useSelector } from 'react-redux'
import {
  addHistoryForActiveTab,
  selectActiveHistory
} from 'store/browser/slices/tabs'
import { useDeeplink } from 'contexts/DeeplinkContext/DeeplinkContext'
import { DeepLink, DeepLinkOrigin } from 'contexts/DeeplinkContext/types'
import { AddHistoryPayload } from 'store/browser'
import InputText from 'components/InputText'
import useClipboardWatcher from 'hooks/useClipboardWatcher'
import useScrollHandler, { ScrollState } from 'hooks/browser/useScrollHandler'
import useRecentWalletHack from 'hooks/browser/useRecentWalletHack'

export default function Browser({
  onNewScrollState
}: {
  onNewScrollState: (scrollState: ScrollState) => void
}): JSX.Element {
  const dispatch = useDispatch()
  const { setPendingDeepLink } = useDeeplink()
  const [urlEntry, setUrlEntry] = useState('')
  const [urlToLoad, setUrlToLoad] = useState('')
  const clipboard = useClipboardWatcher()
  const { scrollState, onScrollHandler } = useScrollHandler()
  const { injectCoreAsRecent } = useRecentWalletHack()
  const activeHistory = useSelector(selectActiveHistory)
  const webViewRef = useRef<WebView>(null)

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
        onChangeText={setUrlEntry}
        onSubmit={() => setUrlToLoad(urlEntry)}
      />
      <WebView
        ref={webViewRef}
        pullToRefreshEnabled={true}
        injectedJavaScript={injectCoreAsRecent}
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
          const history: AddHistoryPayload = {
            title: event.nativeEvent.title,
            url: event.nativeEvent.url
          }
          dispatch(addHistoryForActiveTab(history))
          setUrlEntry(event.nativeEvent.url)
        }}
        onMessage={() =>
          //do not remove this listener, https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md#injectedjavascript
          Logger.trace('WebView onMessage')
        }
      />
    </View>
  )
}

import React, { useEffect, useState } from 'react'
import { View } from '@avalabs/k2-mobile'
import WebView from 'react-native-webview'
import Logger from 'utils/Logger'
import { useDispatch } from 'react-redux'
import { addHistoryForActiveTab } from 'store/browser/slices/tabs'
import { useDeeplink } from 'contexts/DeeplinkContext/DeeplinkContext'
import { DeepLink, DeepLinkOrigin } from 'contexts/DeeplinkContext/types'
import { AddHistoryPayload } from 'store/browser'
import InputText from 'components/InputText'
import useClipboardWatcher from 'hooks/useClipboardWatcher'
import useScrollHandler from 'hooks/browser/useScrollHandler'
import useRecentWalletHack from 'hooks/browser/useRecentWalletHack'

export default function Browser(): JSX.Element {
  const dispatch = useDispatch()
  const { setPendingDeepLink } = useDeeplink()
  const [urlEntry, setUrlEntry] = useState('')
  const [urlToLoad, setUrlToLoad] = useState('')
  const clipboard = useClipboardWatcher()
  const { scrollState, onScrollHandler } = useScrollHandler()
  const { injectCoreAsRecent } = useRecentWalletHack()

  useEffect(() => {
    Logger.trace('TODO: pass this to Dock', scrollState)
  }, [scrollState])

  useEffect(() => {
    //initiate deep link if user copies WC link to clipboard
    if (clipboard.startsWith('wc:')) {
      setPendingDeepLink({
        url: clipboard,
        origin: DeepLinkOrigin.ORIGIN_QR_CODE
      } as DeepLink)
    }
  }, [clipboard, setPendingDeepLink])

  return (
    <View style={{ width: '100%', height: '100%' }}>
      <InputText
        text={urlEntry}
        onChangeText={setUrlEntry}
        onSubmit={() => setUrlToLoad(urlEntry)}
      />
      <WebView
        injectedJavaScript={injectCoreAsRecent}
        source={{ uri: urlToLoad }}
        onNavigationStateChange={event => {
          const history: AddHistoryPayload = {
            title: event.title,
            url: event.url
          }
          dispatch(addHistoryForActiveTab(history))
          setUrlEntry(event.url)
        }}
        setSupportMultipleWindows={false}
        onScroll={onScrollHandler}
        onError={event => {
          Logger.error('WebView onError', event.nativeEvent.description)
        }}
        onMessage={event =>
          Logger.trace('WebView onMessage', event.nativeEvent.data)
        }
      />
    </View>
  )
}

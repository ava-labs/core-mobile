import React, { useEffect, useMemo, useState } from 'react'
import { View } from '@avalabs/k2-mobile'
import WebView from 'react-native-webview'
import Logger from 'utils/Logger'
import { useDispatch, useSelector } from 'react-redux'
import { addHistoryForTab, selectActiveTab } from 'store/browser/slices/tabs'
import Clipboard from '@react-native-clipboard/clipboard'
import { useDeeplink } from 'contexts/DeeplinkContext/DeeplinkContext'
import { DeepLink, DeepLinkOrigin } from 'contexts/DeeplinkContext/types'
import { WebViewScrollEvent } from 'react-native-webview/lib/WebViewTypes'
import { AddHistoryPayload } from 'store/browser'
import InputText from 'components/InputText'

const THROTTLE = 300
const DEBOUNCE = 500

export default function Browser(): JSX.Element {
  const dispatch = useDispatch()
  const { setPendingDeepLink } = useDeeplink()
  const [scrollDirection, setScrollDirection] = useState<
    'up' | 'down' | 'idle'
  >('idle')
  const activeTab = useSelector(selectActiveTab)
  const [urlEntry, setUrlEntry] = useState('')
  const [urlToLoad, setUrlToLoad] = useState('')

  useEffect(() => {
    Logger.trace('------> Browser:scrollDirection', scrollDirection)
  }, [scrollDirection])

  useEffect(() => {
    Clipboard.addListener(async () => {
      const clipboard = await Clipboard.getString()
      if (clipboard.startsWith('wc:')) {
        setPendingDeepLink({
          url: clipboard,
          origin: DeepLinkOrigin.ORIGIN_QR_CODE
        } as DeepLink)
      }
    })
    return () => {
      Clipboard.removeAllListeners()
    }
  }, [setPendingDeepLink])

  const scrollHandler = useMemo(() => {
    let lastY = 0
    let lastCall = 0
    let timeout: NodeJS.Timeout | undefined
    return (event: WebViewScrollEvent) => {
      const now = Date.now()
      if (now - lastCall >= THROTTLE) {
        if (timeout) {
          clearTimeout(timeout)
        }
        timeout = setTimeout(() => {
          setScrollDirection('idle')
        }, DEBOUNCE)
        lastCall = now
      }
      if (lastY !== 0) {
        const direction = event.nativeEvent.contentOffset.y - lastY
        direction > 0 ? setScrollDirection('down') : setScrollDirection('up')
      }
      lastY = event.nativeEvent.contentOffset.y
    }
  }, [])

  // const getRecentWallet = `(async function(){
  //   let printRecentWallet = async function(){
  //     const recentWallet = window.localStorage.getItem('WCM_RECENT_WALLET_DATA');
  //     window.ReactNativeWebView.postMessage(recentWallet)
  //     await new Promise(r => setTimeout(r, 1000));
  //   }
  //   while (true){
  //     await printRecentWallet();
  //   }
  // })();`

  const setRecentWallet = `(async function(){ 
    const coreWallet = {
      id: 'f323633c1f67055a45aac84e321af6ffe46322da677ffdd32f9bc1e33bafe29c',
      name: 'Core',
      homepage:
        'https://core.app/?utm_source=referral&utm_medium=website&utm_campaign=walletconnect',
      image_id: '35f9c46e-cc57-4aa7-315d-e6ccb2a1d600',
      order: 3230,
      app: {
        browser: null,
        ios: 'https://apps.apple.com/us/app/core-crypto-wallet-nfts/id6443685999',
        android:
          'https://play.google.com/store/apps/details?id=com.avaxwallet&hl=en_US&gl=US',
        mac: null,
        windows: null,
        linux: null,
        chrome:
          'https://chrome.google.com/webstore/detail/core-crypto-wallet-nft-ex/agoakfejjabomempkjlepdflaleeobhb',
        firefox: null,
        safari: null,
        edge: null,
        opera: null
      },
      injected: [
        {
          injected_id: 'isAvalanche',
          namespace: 'eip155'
        }
      ],
      rdns: null,
      mobile: {
        native: 'core://',
        universal: 'https://core.app'
      },
      desktop: {
        native: null,
        universal: null
      }
    }
  
    window.localStorage.setItem('WCM_RECENT_WALLET_DATA', JSON.stringify(coreWallet));
    const recentWallet = window.localStorage.getItem('WCM_RECENT_WALLET_DATA');
    window.ReactNativeWebView.postMessage(recentWallet)
  })();`

  return (
    <View style={{ width: '100%', height: '100%' }}>
      <InputText
        text={urlEntry}
        onChangeText={setUrlEntry}
        onSubmit={() => setUrlToLoad(urlEntry)}
      />
      <WebView
        injectedJavaScript={setRecentWallet}
        source={{ uri: urlToLoad }}
        onShouldStartLoadWithRequest={request => {
          Logger.trace('WebView on should load', request.url)
          return true
        }}
        onNavigationStateChange={event => {
          Logger.trace('------> onNavigationStateChange', event.navigationType)
          if (activeTab) {
            const history: AddHistoryPayload = {
              tabId: activeTab.id,
              history: {
                title: event.title,
                url: event.url
              }
            }
            Logger.trace('------> Browser:add to history', history)
            dispatch(addHistoryForTab(history))
          }
        }}
        setSupportMultipleWindows={false}
        onLoadStart={event => {
          Logger.trace('------> Browser:onload start', event.nativeEvent.url)
        }}
        onScroll={scrollHandler}
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

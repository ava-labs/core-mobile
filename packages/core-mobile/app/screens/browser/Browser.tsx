import React, { useEffect, useMemo, useState } from 'react'
import { View } from '@avalabs/k2-mobile'
import WebView from 'react-native-webview'
import Logger from 'utils/Logger'
import { useDispatch } from 'react-redux'
import { addHistoryForTab } from 'store/browser/slices/tabs'
import Clipboard from '@react-native-clipboard/clipboard'
import { useDeeplink } from 'contexts/DeeplinkContext/DeeplinkContext'
import { DeepLink, DeepLinkOrigin } from 'contexts/DeeplinkContext/types'
import { WebViewScrollEvent } from 'react-native-webview/lib/WebViewTypes'

const THROTTLE = 300
const DEBOUNCE = 500

export default function Browser(): JSX.Element {
  const dispatch = useDispatch()
  const { setPendingDeepLink } = useDeeplink()
  const [scrollDirection, setScrollDirection] = useState<
    'up' | 'down' | 'idle'
  >('idle')

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

  return (
    <View style={{ width: '100%', height: '100%' }}>
      <WebView
        source={{ uri: 'https://opensea.io' }}
        onShouldStartLoadWithRequest={request => {
          Logger.trace('------> Browser:request', request)
          if (request.navigationType === 'click') {
            Logger.trace('------> Browser:request', request)
            const history = {
              tabId: 'neven',
              history: {
                title: request.title,
                url: request.url
              }
            }
            Logger.trace('------> Browser:add to history', history)
            dispatch(addHistoryForTab(history))
          }
          return true
        }}
        onLoadStart={event => {
          Logger.trace('------> Browser:onload start', event)
        }}
        onScroll={scrollHandler}
      />
    </View>
  )
}

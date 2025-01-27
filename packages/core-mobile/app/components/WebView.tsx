import React from 'react'
import RNWebView, { WebViewMessageEvent } from 'react-native-webview'
import Logger from 'utils/Logger'
import {
  ShouldStartLoadRequest,
  WebViewNavigationEvent
} from 'react-native-webview/lib/WebViewTypes'

export type WebViewParams = {
  url: string
  webViewRef?: React.RefObject<RNWebView>
  injectedJavaScript?: string
  onLoad?: (event: WebViewNavigationEvent) => void
  onMessage?: (event: WebViewMessageEvent) => void
  testID?: string
  onShouldStartLoadWithRequest?: (event: ShouldStartLoadRequest) => boolean
}

export const WebView = ({
  webViewRef,
  injectedJavaScript,
  url,
  onLoad,
  onMessage,
  onShouldStartLoadWithRequest,
  testID
}: WebViewParams): React.JSX.Element => {
  return (
    <RNWebView
      javaScriptCanOpenWindowsAutomatically={true}
      allowsInlineMediaPlayback={true}
      javaScriptEnabled={true}
      testID={testID}
      ref={webViewRef}
      pullToRefreshEnabled={true}
      injectedJavaScriptForMainFrameOnly={false}
      injectedJavaScript={injectedJavaScript}
      source={{ uri: url }}
      setSupportMultipleWindows={false}
      onError={event => {
        Logger.error('WebView onError', event.nativeEvent.description)
      }}
      onLoadEnd={() => {
        Logger.trace('------> onLoadEnd')
      }}
      onLoad={onLoad}
      onMessage={onMessage}
      onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
    />
  )
}

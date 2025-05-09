import React from 'react'
import RNWebView, {
  WebViewMessageEvent,
  WebViewNavigationEvent,
  WebViewProps
} from 'react-native-webview'
import Logger from 'utils/Logger'

export interface WebViewParams extends WebViewProps {
  url: string
  webViewRef?: React.RefObject<RNWebView>
  injectedJavaScript?: string
  onLoad?: (event: WebViewNavigationEvent) => void
  onMessage?: (event: WebViewMessageEvent) => void
  testID?: string
}

export const WebView = ({
  webViewRef,
  injectedJavaScript,
  url,
  onLoad,
  onError,
  onMessage,
  testID,
  ...props
}: WebViewParams): React.JSX.Element => {
  return (
    <RNWebView
      javaScriptCanOpenWindowsAutomatically={true}
      allowsInlineMediaPlayback={true}
      testID={testID}
      ref={webViewRef}
      injectedJavaScriptForMainFrameOnly={false}
      injectedJavaScript={injectedJavaScript}
      source={{ uri: url }}
      setSupportMultipleWindows={false}
      onError={event => {
        onError?.(event)
        Logger.error('WebView onError', event.nativeEvent.description)
      }}
      onLoadEnd={() => {
        Logger.trace('------> onLoadEnd')
      }}
      onLoad={onLoad}
      onMessage={onMessage}
      {...props}
    />
  )
}

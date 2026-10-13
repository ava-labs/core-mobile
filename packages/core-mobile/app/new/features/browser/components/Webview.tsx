import React from 'react'
import RNWebView, {
  WebViewMessageEvent,
  WebViewNavigationEvent,
  WebViewProps
} from 'react-native-webview'
import Logger from 'utils/Logger'

export interface WebViewParams extends WebViewProps {
  url: string
  webViewRef?: React.RefObject<RNWebView | null>
  injectedJavaScript?: string
  injectedJavaScriptBeforeContentLoaded?: string
  onLoad?: (event: WebViewNavigationEvent) => void
  onMessage?: (event: WebViewMessageEvent) => void
  testID?: string
}

export const WebView = ({
  webViewRef,
  injectedJavaScript,
  injectedJavaScriptBeforeContentLoaded,
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
      injectedJavaScriptForMainFrameOnly={true}
      injectedJavaScript={injectedJavaScript}
      injectedJavaScriptBeforeContentLoaded={
        injectedJavaScriptBeforeContentLoaded
      }
      injectedJavaScriptBeforeContentLoadedForMainFrameOnly={true}
      source={{ uri: url }}
      setSupportMultipleWindows={false}
      onError={event => {
        onError?.(event)
        // Load failures are external (site down, connection lost, bad cert)
        // and already surfaced to the user by the WebView error view — warn
        // so they don't reach Sentry.
        Logger.warn('WebView onError', event.nativeEvent.description)
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

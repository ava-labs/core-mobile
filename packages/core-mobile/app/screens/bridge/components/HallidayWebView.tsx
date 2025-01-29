import { WebView } from 'components/WebView'
import { useInjectedJavascript } from 'hooks/browser/useInjectedJavascript'
import React from 'react'

const HALLIDAY_BRIDGE_URL = 'https://core.app/bridge?useHalliday=1&useEmbed=1'

export const HallidayWebView = (): React.JSX.Element => {
  const { coreConnectInterceptor } = useInjectedJavascript()

  return (
    <WebView
      url={HALLIDAY_BRIDGE_URL}
      injectedJavaScript={coreConnectInterceptor}
      testID="halliday-bridge-webview"
    />
  )
}

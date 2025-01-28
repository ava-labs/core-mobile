import { WebView } from 'components/WebView'
import { useInjectedJavascript } from 'hooks/browser/useInjectedJavascript'
import React from 'react'

const HALLIDAY_BRIDGE_URL = 'http://core.app/bridge?useHalliday=1&useEmbed=1'

export const HallidayWebView = (): React.JSX.Element => {
  const { coreConnectInterceptor } = useInjectedJavascript()

  // reload iframe with 5 seconds delay
  const checkAndReloadIframeScript = `
    const iframe = document.getElementById('halliday-iframe');
    if (iframe) {      
      setTimeout(() => {
        iframe.src = iframe.src;
      }, 5000); // Delay of 5 seconds
    };
  `

  return (
    <WebView
      url={HALLIDAY_BRIDGE_URL}
      injectedJavaScript={checkAndReloadIframeScript + coreConnectInterceptor}
      testID="halliday-bridge-webview"
    />
  )
}

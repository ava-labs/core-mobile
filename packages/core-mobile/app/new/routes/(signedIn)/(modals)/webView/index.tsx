import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { WebView } from 'components/WebView'
import { useInjectedJavascript } from 'hooks/browser/useInjectedJavascript'
import { SafeAreaView } from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'

const WebViewScreen = (): React.JSX.Element => {
  const { url, testID } = useLocalSearchParams<{
    url: string
    testID?: string
  }>()
  const { coreConnectInterceptor } = useInjectedJavascript()

  return (
    <BlurredBarsContentLayout>
      <SafeAreaView sx={{ flex: 1 }}>
        <WebView
          url={url}
          testID={testID}
          injectedJavaScript={coreConnectInterceptor}
        />
      </SafeAreaView>
    </BlurredBarsContentLayout>
  )
}

export default WebViewScreen

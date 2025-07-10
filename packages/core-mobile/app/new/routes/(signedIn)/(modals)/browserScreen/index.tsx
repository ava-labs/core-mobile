import { View } from '@avalabs/k2-alpine'
import {
  BrowserTab,
  BrowserTabRef
} from 'features/browser/components/BrowserTab'
import React, { RefObject, useRef } from 'react'
import { useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { WebViewProgressEvent } from 'react-native-webview/lib/WebViewTypes'
import { useSelector } from 'react-redux'
import { selectActiveTab } from 'store/browser'

const BrowserScreen = (): React.ReactNode => {
  const browserRefs = useRef<Record<string, RefObject<BrowserTabRef> | null>>(
    {}
  )
  const insets = useSafeAreaInsets()
  const activeTab = useSelector(selectActiveTab)
  const progress = useSharedValue(0)

  const onProgress = (event: WebViewProgressEvent): void => {
    progress.value = event.nativeEvent.progress
  }

  return (
    <View style={{ flex: 1, marginBottom: insets.bottom }}>
      <BrowserTab
        ref={browserRefs.current[activeTab?.id ?? '']}
        tabId={activeTab?.id ?? ''}
        onProgress={onProgress}
        progress={progress}
      />
    </View>
  )
}

export default BrowserScreen

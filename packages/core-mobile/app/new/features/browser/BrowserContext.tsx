import React, { useRef } from 'react'
import { TextInput } from 'react-native'
import { SharedValue, useSharedValue } from 'react-native-reanimated'
import { WebViewProgressEvent } from 'react-native-webview/lib/WebViewTypes'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { addHistoryForActiveTab, selectActiveTab } from 'store/browser'
import Logger from 'utils/Logger'
import { isValidHttpUrl, normalizeUrlWithHttps } from './consts'
import { BrowserTabRef } from './components/BrowserTab'

export type BrowserContextType = {
  urlEntry: string
  progress: SharedValue<number>
  inputRef?: React.RefObject<TextInput>
  browserRefs: React.RefObject<Record<string, React.RefObject<BrowserTabRef>>>
  handleUrlSubmit: (url?: string) => void
  onProgress: (event: WebViewProgressEvent) => void
  setUrlEntry: (url: string) => void
}

const BrowserContext = React.createContext<BrowserContextType | null>(null)

function useBrowserContextValue(): BrowserContextType {
  const activeTab = useSelector(selectActiveTab)
  const progress = useSharedValue(0)
  const dispatch = useDispatch()

  const inputRef = useRef<TextInput>(null)
  const browserRefs = React.useRef<
    Record<string, React.RefObject<BrowserTabRef>>
  >({})

  const [urlEntry, setUrlEntry] = React.useState<string>(
    activeTab?.activeHistory?.url ?? ''
  )

  function handleUrlSubmit(url?: string): void {
    if (!url) return

    const normalized = normalizeUrlWithHttps(url || urlEntry)

    if (activeTab?.id) {
      const browserRef = browserRefs.current?.[activeTab.id]?.current

      if (browserRef) {
        if (isValidHttpUrl(normalized)) {
          browserRef.loadUrl(normalized)
        } else {
          const googleUrl =
            'https://www.google.com/search?q=' + encodeURIComponent(url)

          dispatch(
            addHistoryForActiveTab({
              title: url,
              url: googleUrl
            })
          )
          browserRef.loadUrl(googleUrl)
        }
      } else {
        alert(`Ref for tab ${activeTab.id} is not available`)
      }
    } else {
      alert('no active tab')
    }
  }

  const onProgress = (event: WebViewProgressEvent): void => {
    progress.value = event.nativeEvent.progress
  }

  return {
    inputRef,
    browserRefs,
    progress,
    urlEntry,
    handleUrlSubmit,
    onProgress,
    setUrlEntry
  }
}

export function useBrowserContext(): BrowserContextType {
  const context = React.useContext(BrowserContext)
  if (!context) {
    throw new Error('useBrowserContext must be used within a BrowserProvider')
  }
  return context
}

export const BrowserProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const value = useBrowserContextValue()

  return (
    <BrowserContext.Provider value={value}>{children}</BrowserContext.Provider>
  )
}

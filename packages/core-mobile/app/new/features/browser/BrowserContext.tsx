import React, { useRef } from 'react'
import { TextInput } from 'react-native'
import { SharedValue, useSharedValue } from 'react-native-reanimated'
import { WebViewProgressEvent } from 'react-native-webview/lib/WebViewTypes'
import { useDispatch, useSelector } from 'react-redux'
import { addHistoryForActiveTab, selectActiveTab } from 'store/browser'
import { BrowserTabRef } from './components/BrowserTab'
import { isValidHttpUrl, normalizeUrlWithHttps } from './consts'

export type BrowserContextType = {
  urlEntry: string
  progress: SharedValue<number>
  inputRef?: React.RefObject<TextInput>
  browserRefs: React.RefObject<Record<string, React.RefObject<BrowserTabRef>>>
  handleClearAndFocus: () => void
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
    if (!activeTab?.id) return

    const browserRef = browserRefs.current?.[activeTab.id]?.current
    const normalized = normalizeUrlWithHttps(url || urlEntry)

    if (isValidHttpUrl(normalized)) {
      browserRef?.loadUrl(normalized)
      setUrlEntry(normalized)
    } else {
      openGoogleSearch(normalized)
    }
  }

  const handleClearAndFocus = (): void => {
    setUrlEntry('')
    if (!inputRef?.current?.isFocused()) {
      inputRef?.current?.focus()
    }
  }

  const openGoogleSearch = (url: string): void => {
    if (!activeTab?.id) return

    const googleUrl =
      'https://www.google.com/search?q=' + encodeURIComponent(url)

    dispatch(
      addHistoryForActiveTab({
        title: url,
        url: googleUrl
      })
    )

    setUrlEntry(googleUrl)
    browserRefs.current?.[activeTab.id]?.current?.loadUrl(googleUrl)
  }

  const onProgress = (event: WebViewProgressEvent): void => {
    progress.value = event.nativeEvent.progress
  }

  return {
    inputRef,
    browserRefs,
    progress,
    urlEntry,
    handleClearAndFocus,
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

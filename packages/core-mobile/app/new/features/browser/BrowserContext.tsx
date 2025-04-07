import React, { useRef } from 'react'
import { TextInput } from 'react-native'
import { SharedValue, useSharedValue } from 'react-native-reanimated'
import { WebViewProgressEvent } from 'react-native-webview/lib/WebViewTypes'
import { useDispatch, useSelector } from 'react-redux'
import { addHistoryForActiveTab, selectActiveTab } from 'store/browser'
import { BrowserTabRef } from './components/BrowserTab'
import { isValidHttpUrl } from './utils'

export type BrowserContextType = {
  urlEntry: string
  progress: SharedValue<number>
  inputRef?: React.RefObject<TextInput>
  browserRefs: React.MutableRefObject<
    Record<string, React.RefObject<BrowserTabRef> | null>
  >
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
  const browserRefs = useRef<
    Record<string, React.RefObject<BrowserTabRef> | null>
  >({})

  const [urlEntry, setUrlEntry] = React.useState<string>(
    activeTab?.activeHistory?.url ?? ''
  )

  function handleUrlSubmit(url?: string): void {
    if (!url) return

    if (inputRef?.current?.isFocused()) {
      inputRef?.current?.blur()
    }

    if (isValidHttpUrl(url)) {
      setUrlEntry(url)
      if (activeTab?.id && browserRefs.current[activeTab.id]?.current) {
        browserRefs.current[activeTab.id]?.current?.loadUrl(url)
      }
    } else {
      openGoogleSearch(url)
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
    browserRefs.current[activeTab.id]?.current?.loadUrl(googleUrl)
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

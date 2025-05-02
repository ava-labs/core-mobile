import React, { RefObject, useEffect, useRef, useState } from 'react'
import { TextInput } from 'react-native'
import { SharedValue, useSharedValue } from 'react-native-reanimated'
import { WebViewProgressEvent } from 'react-native-webview/lib/WebViewTypes'
import { useDispatch, useSelector } from 'react-redux'
import { addHistoryForActiveTab, selectActiveTab } from 'store/browser'
import { BrowserTabRef } from './components/BrowserTab'
import { isValidHttpUrl, normalizeUrlWithHttps } from './utils'

export type BrowserContextType = {
  urlEntry: string
  progress: SharedValue<number>
  inputRef?: React.RefObject<TextInput>
  browserRefs: React.MutableRefObject<
    Record<string, React.RefObject<BrowserTabRef> | null>
  >
  showRecentSearches: SharedValue<boolean>
  isRenameFavoriteVisible: SharedValue<boolean>
  handleClearAndFocus: () => void
  handleUrlSubmit: (url?: string) => void
  onProgress: (event: WebViewProgressEvent) => void
  setUrlEntry: (url: string) => void
}

const BrowserContext = React.createContext<BrowserContextType | null>(null)

function useBrowserContextValue(): BrowserContextType {
  const dispatch = useDispatch()

  const activeTab = useSelector(selectActiveTab)
  const [urlEntry, setUrlEntry] = useState<string>(
    activeTab?.activeHistory?.url ?? ''
  )

  const inputRef = useRef<TextInput>(null)
  const browserRefs = useRef<Record<string, RefObject<BrowserTabRef> | null>>(
    {}
  )

  const progress = useSharedValue(0)
  const isRenameFavoriteVisible = useSharedValue(false)
  const showRecentSearches = useSharedValue(false)

  useEffect(() => {
    if (urlEntry.length > 0) {
      if (!showRecentSearches.value) {
        showRecentSearches.value = true
      }
    } else {
      showRecentSearches.value = false
    }
  }, [urlEntry, showRecentSearches])

  function handleUrlSubmit(url?: string): void {
    if (!url) return

    if (inputRef?.current?.isFocused()) {
      inputRef?.current?.blur()
    }

    const normalized = normalizeUrlWithHttps(url)

    if (isValidHttpUrl(normalized)) {
      setUrlEntry(normalized)
      if (activeTab?.id && browserRefs.current[activeTab.id]?.current) {
        dispatch(
          addHistoryForActiveTab({
            title: normalized,
            url: normalized
          })
        )
        browserRefs.current[activeTab.id]?.current?.loadUrl(normalized)
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
    isRenameFavoriteVisible,
    showRecentSearches,
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

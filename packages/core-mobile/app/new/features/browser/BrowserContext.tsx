import React, { RefObject, useEffect, useRef, useState } from 'react'
import { InteractionManager, TextInput } from 'react-native'
import { SharedValue, useSharedValue } from 'react-native-reanimated'
import { WebViewProgressEvent } from 'react-native-webview/lib/WebViewTypes'
import { useDispatch, useSelector } from 'react-redux'
import { addHistoryForActiveTab, selectActiveTab } from 'store/browser'
import { BrowserTabRef } from './components/BrowserTab'
import { isValidHttpUrl, normalizeUrlWithHttps } from './utils'

export type BrowserContextType = {
  urlEntry: string
  progress: SharedValue<number>
  inputRef?: React.RefObject<TextInput | null>
  browserRefs: React.RefObject<
    Record<string, React.RefObject<BrowserTabRef | null>>
  >
  showRecentSearches: SharedValue<boolean>
  isFocused: SharedValue<boolean>
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
  const browserRefs = useRef<Record<string, RefObject<BrowserTabRef | null>>>(
    {}
  )

  const progress = useSharedValue(0)
  const isFocused = useSharedValue(false)
  const isRenameFavoriteVisible = useSharedValue(false)
  const showRecentSearches = useSharedValue(false)

  useEffect(() => {
    // Keep the input in sync with the active tab's url when navigation changes
    // Don't overwrite user typing while the input is focused.
    if (inputRef.current?.isFocused()) return

    const nextUrl = activeTab?.activeHistory?.url ?? ''
    setUrlEntry(nextUrl)
  }, [activeTab?.activeHistory?.url, activeTab?.activeHistoryIndex])

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
      InteractionManager.runAfterInteractions(() => {
        inputRef?.current?.blur()
      })
    }

    const normalized = normalizeUrlWithHttps(url)

    if (isValidHttpUrl(normalized)) {
      openUrl(normalized)
    } else {
      const googleUrl =
        'https://www.google.com/search?q=' + encodeURIComponent(url)
      openUrl(googleUrl)
    }
  }

  const openUrl = (url: string): void => {
    setUrlEntry(url)
    if (!activeTab?.id) return

    // Drive navigation through Redux history: BrowserTab renders its WebView off
    // the active history entry, so this alone loads the page. This must NOT be
    // gated on the imperative tab ref — on the first submit (notably Android)
    // the per-tab ref hasn't attached yet, and gating here dropped the whole
    // navigation, so nothing happened until a second submit.
    dispatch(
      addHistoryForActiveTab({
        title: url,
        url: url
      })
    )

    // Best-effort imperative load for the already-mounted WebView. Redundant
    // with the history-driven path above, so it's fine when the ref is absent.
    browserRefs.current[activeTab.id]?.current?.loadUrl(url)
  }

  const handleClearAndFocus = (): void => {
    setUrlEntry('')
    if (!inputRef?.current?.isFocused()) {
      InteractionManager.runAfterInteractions(() => {
        inputRef?.current?.focus()
      })
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
    isFocused,
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

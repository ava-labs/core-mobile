import { useMemo, useState } from 'react'
import { WebViewScrollEvent } from 'react-native-webview/lib/WebViewTypes'

const THROTTLE = 300
const DEBOUNCE = 500

export enum ScrollState {
  'up',
  'down',
  'idle'
}

export default function useScrollHandler(): {
  onScrollHandler: (e: WebViewScrollEvent) => void
  scrollState: ScrollState
} {
  const [scrollState, setScrollState] = useState<ScrollState>(ScrollState.idle)

  const onScrollHandler = useMemo(() => {
    let lastY = 0
    let lastCall = 0
    let timeout: number
    return (event: WebViewScrollEvent) => {
      const now = Date.now()
      if (now - lastCall >= THROTTLE) {
        if (timeout) {
          clearTimeout(timeout)
        }
        timeout = setTimeout(() => {
          setScrollState(ScrollState.idle)
        }, DEBOUNCE)
        lastCall = now
      }
      if (lastY !== 0) {
        const direction = event.nativeEvent.contentOffset.y - lastY
        direction > 0
          ? setScrollState(ScrollState.down)
          : setScrollState(ScrollState.up)
      }
      lastY = event.nativeEvent.contentOffset.y
      if (lastY < 0) {
        lastY = 0
      }
    }
  }, [])

  return {
    onScrollHandler,
    scrollState
  }
}

import { useLayoutEffect, useState } from 'react'
import { AppState } from 'react-native'

export function useBgDetect(): { inBackground: boolean } {
  const [inBackground, setInBackground] = useState(false)

  useLayoutEffect(() => {
    const sub = AppState.addEventListener('change', nextAppState => {
      if (['inactive', 'background'].includes(nextAppState)) {
        setInBackground(true)
      } else if (nextAppState === 'active') {
        setInBackground(false)
      }
    })
    return () => {
      sub.remove()
    }
  }, [])

  return {
    inBackground
  }
}

import { useCallback, useEffect } from 'react'
import { useNavigation } from 'expo-router'

export enum RemoveEvents {
  GO_BACK = 'GO_BACK',
  POP = 'POP'
}

export function useBeforeRemoveListener(
  callback: () => void,
  events: RemoveEvents[],
  preventDefault?: boolean
): void {
  const { addListener } = useNavigation()

  const innerCallback = useCallback(
    (e: { data: { action: { type: string } }; preventDefault: () => void }) => {
      if (events.includes(e.data.action.type as RemoveEvents)) {
        if (preventDefault) {
          e.preventDefault()
        }
        callback()
      }
    },
    [events, preventDefault, callback]
  )

  useEffect(() => {
    // `addListener` returns the unsubscribe fn. React Navigation v6+/expo-router
    // no longer exposes `removeListener`, so we must use the returned cleanup.
    return addListener('beforeRemove', innerCallback)
  }, [addListener, innerCallback])
}

import { useCallback, useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'

export enum RemoveEvents {
  GO_BACK = 'GO_BACK',
  POP = 'POP'
}

export function useBeforeRemoveListener(
  callback: () => void,
  events: RemoveEvents[],
  preventDefault?: boolean
) {
  const { addListener, removeListener } = useNavigation()

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
    addListener('beforeRemove', innerCallback)
    return () => removeListener('beforeRemove', innerCallback)
  }, [addListener, callback, innerCallback, removeListener])
}

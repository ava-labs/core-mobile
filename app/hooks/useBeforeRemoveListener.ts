import { useCallback, useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'

export enum RemoveEvents {
  GO_BACK = 'GO_BACK',
  POP = 'POP'
}

export function useBeforeRemoveListener(
  callback: () => void,
  events: RemoveEvents[]
) {
  const { addListener, removeListener } = useNavigation()

  const innerCallback = useCallback(
    (e: { data: { action: { type: string } } }) => {
      if (events.includes(e.data.action.type as RemoveEvents)) {
        callback()
      }
    },
    [events, callback]
  )

  useEffect(() => {
    addListener('beforeRemove', innerCallback)
    return () => removeListener('beforeRemove', innerCallback)
  }, [addListener, callback, innerCallback, removeListener])
}

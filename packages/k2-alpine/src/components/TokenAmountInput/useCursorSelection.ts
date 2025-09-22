import { noop } from '@avalabs/core-utils-sdk/dist'
import { useState, useCallback } from 'react'
import {
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
  Platform
} from 'react-native'

/**
 * Hook to manage text input cursor (selection).
 * - iOS: returns `undefined` for selection and handler (use native behavior).
 * - Android: tracks selection and allows moving cursor to either front or end of the text.
 */
export const useCursorSelection = (): {
  selection: { start: number; end: number } | undefined
  handleSelectionChange:
    | ((e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => void)
    | undefined
  moveCursorToFront: () => void
  moveCursorToEnd: (text: string) => void
} => {
  const [selection, setSelection] = useState({ start: 0, end: 0 })

  const handleSelectionChange = useCallback(
    (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      setSelection(e.nativeEvent.selection)
    },
    []
  )

  const moveCursorToFront = useCallback(() => {
    requestAnimationFrame(() => {
      setSelection({ start: 0, end: 0 })
    })
  }, [])

  const moveCursorToEnd = useCallback((text: string) => {
    requestAnimationFrame(() => {
      const pos = text.length
      setSelection({ start: pos, end: pos })
    })
  }, [])

  if (Platform.OS === 'ios') {
    return {
      selection: undefined,
      handleSelectionChange: undefined,
      moveCursorToFront: noop,
      moveCursorToEnd: noop
    }
  }

  return {
    selection,
    handleSelectionChange,
    moveCursorToFront,
    moveCursorToEnd
  }
}

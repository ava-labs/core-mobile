import { noop } from '@avalabs/core-utils-sdk'
import { useState, useCallback } from 'react'
import {
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
  Platform
} from 'react-native'

const CURSOR_MAX = 100 // arbitrarily large number

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
  moveCursorToEnd: () => void
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

  const moveCursorToEnd = useCallback(() => {
    // Use a large selection index to force the cursor to the end.
    // React Native will clamp it to the actual text length if it's shorter.
    requestAnimationFrame(() => {
      setSelection({ start: CURSOR_MAX, end: CURSOR_MAX })
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

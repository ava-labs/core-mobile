import { useEffect, useState } from 'react'
import { Platform } from 'react-native'

/**
 * useTextInputSelection
 *
 * Provides controlled selection management for TextInput components on iOS and Android.
 * Especially useful for handling cursor position issues when setting long values programmatically.
 *
 * On iOS:
 * - Setting selection to {start: 0, end: 0} may not take effect under certain conditions.
 * - To work around this, the hook temporarily sets the selection to {0,1} before resetting to {0,0}.
 *
 * On Android:
 * - This workaround isn't needed, but the hook still resets the selection to {0,0} when requested.
 *
 * Returns:
 * - selection: current cursor/selection range
 * - setSelection: function to manually set selection
 * - setShouldResetSelection: trigger to perform a selection reset
 */
export const useTextInputSelection = (): {
  selection: { start: number; end: number }
  setSelection: (value: { start: number; end: number }) => void
  setShouldResetSelection: (value: boolean) => void
} => {
  const [shouldResetSelection, setShouldResetSelection] = useState(false)
  const [selection, setSelection] = useState({ start: 0, end: 0 })

  useEffect(() => {
    if (Platform.OS !== 'ios') return

    if (shouldResetSelection) {
      setSelection({
        start: 0,
        end: 1
      })
      requestAnimationFrame(() => {
        setSelection({ start: 0, end: 0 })
        setShouldResetSelection(false)
      })
    }
  }, [shouldResetSelection])

  useEffect(() => {
    if (Platform.OS !== 'android') return

    if (
      shouldResetSelection &&
      (selection.start !== 0 || selection.end !== 0)
    ) {
      setSelection({ start: 0, end: 0 })
      setShouldResetSelection(false)
    }
  }, [shouldResetSelection, selection])

  return {
    selection,
    setSelection,
    setShouldResetSelection
  }
}

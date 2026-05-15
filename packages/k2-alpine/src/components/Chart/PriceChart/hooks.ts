import { useState } from 'react'
import {
  runOnJS,
  SharedValue,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated'

/**
 * Bridges a `SharedValue<number | null>` (driven on the UI thread by the
 * chart's gesture) to React state, only crossing the JS bridge when the
 * value actually changes. Without this dirty-check, `runOnJS(setState)`
 * would fire on every gesture frame, even with no-op updates.
 */
export const useActiveIndex = (
  activeIndex: SharedValue<number | null>
): number | null => {
  const [idx, setIdx] = useState<number | null>(null)
  const lastIdx = useSharedValue<number | null>(null)

  useDerivedValue(() => {
    const next = activeIndex.value
    if (next === lastIdx.value) return
    lastIdx.value = next
    runOnJS(setIdx)(next)
  })

  return idx
}

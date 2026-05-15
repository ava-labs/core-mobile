import { useState } from 'react'
import {
  runOnJS,
  SharedValue,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated'

/** Bridges UI-thread SharedValue to React state; dirty-check avoids per-frame setState. */
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

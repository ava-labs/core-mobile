import { useEffect, useState } from 'react'
import {
  runOnJS,
  SharedValue,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated'
import { isFullFormatNeeded } from './helpers'

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

/**
 * Defers an O(candles) format off the synchronous mount path until either a
 * post-mount macrotask or the first crosshair activation.
 *
 * Gating on `idx` matters: activation flips this within the same render
 * pass, so a `useMemo` behind it recomputes synchronously and a drag can
 * never read a missing entry — at the cost of that one render doing the
 * work inline.
 *
 * `setTimeout(0)`, not `InteractionManager.runAfterInteractions`: on the New
 * Architecture the latter is a deprecated `setImmediate` stub.
 */
export const useIsFullFormatNeeded = (idx: number | null): boolean => {
  const [idleReady, setIdleReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIdleReady(true), 0)
    return () => clearTimeout(timer)
  }, [])

  return isFullFormatNeeded(idleReady, idx)
}

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
 * Gates an expensive "format every candle" computation (e.g.
 * `formatCandleDisplayStrings`, per-candle volume strings) so it never
 * blocks the initial synchronous chart mount. Resolves `true` once either a
 * post-mount macrotask tick has elapsed or the crosshair activates (`idx`
 * becomes non-null) — whichever comes first.
 *
 * If activation races the idle tick, `idx` flips to non-null in the same
 * render pass that reads this hook's return value, so a `useMemo` gated on
 * it recomputes SYNCHRONOUSLY in that same render — never a stale or
 * missing lookup on the frame the user first drags the crosshair. The
 * worst case is that render doing the full O(candles) format work inline
 * (see ChartHeader/ChartFooter for the measured cost).
 *
 * Uses a bare `setTimeout(0)` rather than
 * `InteractionManager.runAfterInteractions`: on the New Architecture the
 * latter is a deprecated stub with plain `setImmediate` semantics (see the
 * note in `StakingRewardChart`), so it buys nothing over a macrotask defer
 * while adding an import.
 */
export const useIsFullFormatNeeded = (idx: number | null): boolean => {
  const [idleReady, setIdleReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIdleReady(true), 0)
    return () => clearTimeout(timer)
  }, [])

  return isFullFormatNeeded(idleReady, idx)
}

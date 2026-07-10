import { useEffect, useRef } from 'react'
import { SharedValue, useSharedValue } from 'react-native-reanimated'
import { shouldSyncExternalValue, valueToProgress } from './helpers'

export const useDialValue = ({
  value,
  max,
  step
}: {
  value: number
  max: number
  step: number
}): {
  progressSv: SharedValue<number>
  isActive: SharedValue<boolean>
  isSettling: SharedValue<boolean>
} => {
  const progressSv = useSharedValue(valueToProgress(value, max))
  const isActive = useSharedValue(false)
  // Held true for a short window after a drag releases so stale mid-drag
  // onChange echoes still draining on the JS thread can't re-sync into
  // progressSv and jerk the arc once the finger is gone. Owned by the
  // gesture's onEnd / preset completion in CircularDial.
  const isSettling = useSharedValue(false)

  // Last range the progress was mapped against. `shouldSyncExternalValue`'s
  // step-sized tolerance exists to damp the dial's own onChange echoes — but
  // when `max` changes (e.g. staking's available-to-stake shrinking once the
  // async fee reservation resolves), the drift it produces is NOT an echo:
  // progress is simply mapped against a stale range, so the displayed number
  // (progress × new max) silently disagrees with the controlled `value`
  // (1 AVAX rendering as "0.99"). Range changes must always remap.
  const lastRangeRef = useRef({ max, step })

  useEffect(() => {
    const rangeChanged =
      lastRangeRef.current.max !== max || lastRangeRef.current.step !== step
    lastRangeRef.current = { max, step }

    if (rangeChanged) {
      // Skip only while a gesture owns the dial (same ownership rule the
      // echo path uses); the next value/range change re-syncs after release.
      if (!isActive.value && !isSettling.value) {
        progressSv.value = valueToProgress(value, max)
      }
      return
    }

    const currentValue = progressSv.value * max
    const decision = shouldSyncExternalValue({
      value,
      currentValue,
      max,
      step,
      isActive: isActive.value,
      isSettling: isSettling.value
    })
    if (decision.sync) {
      progressSv.value = valueToProgress(decision.target, max)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, max, step])

  return { progressSv, isActive, isSettling }
}

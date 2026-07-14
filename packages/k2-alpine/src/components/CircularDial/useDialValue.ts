import { useCallback, useEffect, useRef, useState } from 'react'
import {
  SharedValue,
  useAnimatedReaction,
  useSharedValue
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
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

  // A range change that arrives while a gesture owns the dial is deferred —
  // but the effect below only re-runs on prop changes, and the props may
  // never change again after release (e.g. `max` shrinks during the settle
  // window and the settled value equals the previous one). `hasPendingRemap`
  // bridges that gap: the UI-thread reaction below watches ownership end and
  // bumps `remapRetryTick` so the effect re-runs and applies the deferred
  // remap.
  const hasPendingRemap = useSharedValue(false)
  const [remapRetryTick, setRemapRetryTick] = useState(0)
  const bumpRemapRetryTick = useCallback(
    () => setRemapRetryTick(tick => tick + 1),
    []
  )
  useAnimatedReaction(
    () => isActive.value || isSettling.value,
    (owned, previouslyOwned) => {
      if (!owned && previouslyOwned === true && hasPendingRemap.value) {
        hasPendingRemap.value = false
        scheduleOnRN(bumpRemapRetryTick)
      }
    }
  )

  useEffect(() => {
    const rangeChanged =
      lastRangeRef.current.max !== max || lastRangeRef.current.step !== step

    if (rangeChanged) {
      // Defer while a gesture owns the dial (same ownership rule the echo
      // path uses) — leaving `lastRangeRef` stale and flagging the pending
      // remap so the ownership-end reaction above retries it even when no
      // prop changes again after release.
      if (isActive.value || isSettling.value) {
        hasPendingRemap.value = true
        return
      }
      lastRangeRef.current = { max, step }
      progressSv.value = valueToProgress(value, max)
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
  }, [value, max, step, remapRetryTick])

  return { progressSv, isActive, isSettling }
}

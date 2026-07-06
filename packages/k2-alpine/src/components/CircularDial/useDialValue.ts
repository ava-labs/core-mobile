import { useEffect } from 'react'
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

  useEffect(() => {
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

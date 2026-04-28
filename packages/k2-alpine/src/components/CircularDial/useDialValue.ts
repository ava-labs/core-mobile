import { useEffect } from 'react'
import { SharedValue, useSharedValue } from 'react-native-reanimated'
import { shouldSyncExternalValue, valueToProgress } from './helpers'

/**
 * Mirrors the controlled `value` prop into a UI-thread shared value that
 * drives the dial geometry. Skips syncing while a gesture/animation is
 * active and when the incoming value is within one step (echo damping).
 */
export const useDialValue = ({
  value,
  min,
  max,
  step
}: {
  value: number
  min: number
  max: number
  step: number
}): {
  progressSv: SharedValue<number>
  isActive: SharedValue<boolean>
} => {
  const progressSv = useSharedValue(valueToProgress(value, min, max))
  const isActive = useSharedValue(false)

  useEffect(() => {
    const currentValue = min + progressSv.value * (max - min)
    const decision = shouldSyncExternalValue({
      value,
      currentValue,
      min,
      max,
      step,
      isActive: isActive.value
    })
    if (decision.sync) {
      progressSv.value = valueToProgress(decision.target, min, max)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, min, max, step])

  return { progressSv, isActive }
}

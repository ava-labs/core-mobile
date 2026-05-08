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
} => {
  const progressSv = useSharedValue(valueToProgress(value, max))
  const isActive = useSharedValue(false)

  useEffect(() => {
    const currentValue = progressSv.value * max
    const decision = shouldSyncExternalValue({
      value,
      currentValue,
      max,
      step,
      isActive: isActive.value
    })
    if (decision.sync) {
      progressSv.value = valueToProgress(decision.target, max)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, max, step])

  return { progressSv, isActive }
}

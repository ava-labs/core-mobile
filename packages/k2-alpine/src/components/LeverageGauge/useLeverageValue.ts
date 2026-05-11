import { useEffect } from 'react'
import {
  SharedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { clamp } from '../../utils'
import { shouldSyncExternalValue } from './helpers'

type UseLeverageValueArgs = {
  value: number
  min: number
  max: number
  step: number
}

type UseLeverageValueResult = {
  /** Current value driven by drag; also updated from prop when idle. */
  currentValue: SharedValue<number>
  /** Set to true during active pan; blocks prop→shared sync. */
  isActive: SharedValue<boolean>
}

export const useLeverageValue = ({
  value,
  min,
  max,
  step
}: UseLeverageValueArgs): UseLeverageValueResult => {
  const currentValue = useSharedValue(clamp(value, min, max))
  const isActive = useSharedValue(false)

  useEffect(() => {
    const decision = shouldSyncExternalValue({
      value,
      currentValue: currentValue.value,
      min,
      max,
      step,
      isActive: isActive.value
    })
    if (!decision.sync) return
    currentValue.value = withTiming(decision.target, { duration: 150 })
  }, [value, min, max, step, currentValue, isActive])

  return { currentValue, isActive }
}

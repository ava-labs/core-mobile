import { useEffect } from 'react'
import {
  SharedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { clamp } from './helpers'

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
    // Skip sync while user is dragging — drag wins.
    if (isActive.value) return

    const next = clamp(value, min, max)
    const diff = Math.abs(currentValue.value - next)

    // Skip if within a full step (inclusive) — the incoming value is almost
    // certainly an echo of our own onChange, including stale ones queued via
    // scheduleOnRN that arrive after the settle completed. A real programmatic
    // change (preset button, external update) will land > step away.
    if (diff <= step) return

    currentValue.value = withTiming(next, { duration: 150 })
  }, [value, min, max, step, currentValue, isActive])

  return { currentValue, isActive }
}

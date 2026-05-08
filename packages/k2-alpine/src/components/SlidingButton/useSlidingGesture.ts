import { useMemo } from 'react'
import { Gesture } from 'react-native-gesture-handler'
import {
  SharedValue,
  runOnJS,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { ANIMATED } from '../../utils/animations'
import { clamp } from '../../utils/clamp'
import { activeSide, crossedThreshold } from './helpers'
import { fireResetHaptic, fireSelectionHaptic } from './haptics'
import type { SlideState } from './types'

type Deps = {
  isSingle: boolean
  maxTravel: number
  threshold: number
  translateX: SharedValue<number>
  startX: SharedValue<number>
  hasCrossedRef: SharedValue<boolean>
  handleCommit: (side: 'left' | 'right') => void
}

const makeOnUpdate = ({
  isSingle,
  maxTravel,
  threshold,
  translateX,
  startX,
  hasCrossedRef
}: Deps): ((translationX: number) => void) => {
  return (translationX: number): void => {
    'worklet'
    const minX = isSingle ? 0 : -maxTravel
    translateX.value = clamp(startX.value + translationX, minX, maxTravel)
    const crossed = crossedThreshold({
      translateX: translateX.value,
      maxTravel,
      threshold
    })
    if (crossed !== hasCrossedRef.value) {
      hasCrossedRef.value = crossed
      if (crossed) runOnJS(fireSelectionHaptic)()
    }
  }
}

const makeOnEnd = ({
  maxTravel,
  threshold,
  translateX,
  handleCommit
}: Deps): (() => void) => {
  return (): void => {
    'worklet'
    const crossed = crossedThreshold({
      translateX: translateX.value,
      maxTravel,
      threshold
    })
    if (!crossed) {
      if (translateX.value !== 0) runOnJS(fireResetHaptic)()
      translateX.value = withTiming(0, ANIMATED.TIMING_CONFIG)
      return
    }
    const target = translateX.value >= 0 ? maxTravel : -maxTravel
    const side: 'left' | 'right' = activeSide(translateX.value) ?? 'right'
    translateX.value = withTiming(target, ANIMATED.TIMING_CONFIG)
    runOnJS(handleCommit)(side)
  }
}

export const useSlidingGesture = ({
  isSingle,
  maxTravel,
  threshold,
  disabled,
  state,
  translateX,
  startX,
  handleCommit
}: {
  isSingle: boolean
  maxTravel: number
  threshold: number
  disabled: boolean
  state: SlideState
  translateX: SharedValue<number>
  startX: SharedValue<number>
  handleCommit: (side: 'left' | 'right') => void
}): ReturnType<typeof Gesture.Pan> => {
  const hasCrossedRef = useSharedValue<boolean>(false)

  // Memoize the gesture so GestureDetector doesn't reattach on every render.
  // `handleCommit` is stabilized in useSlidingCommit via useCallback.
  return useMemo(() => {
    const deps: Deps = {
      isSingle,
      maxTravel,
      threshold,
      translateX,
      startX,
      hasCrossedRef,
      handleCommit
    }
    const onUpdate = makeOnUpdate(deps)
    const onEnd = makeOnEnd(deps)
    return Gesture.Pan()
      .enabled(!disabled && state === 'idle')
      .onBegin(() => {
        startX.value = translateX.value
        hasCrossedRef.value = false
      })
      .onUpdate(event => onUpdate(event.translationX))
      .onEnd(onEnd)
  }, [
    isSingle,
    maxTravel,
    threshold,
    disabled,
    state,
    translateX,
    startX,
    handleCommit,
    hasCrossedRef
  ])
}

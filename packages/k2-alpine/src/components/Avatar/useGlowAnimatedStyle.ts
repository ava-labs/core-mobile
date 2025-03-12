import { useEffect, useState } from 'react'
import { ImageStyle } from 'react-native'
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming
} from 'react-native-reanimated'

export const useGlowAnimatedStyle = (
  delay: number
): { animatedStyle: ImageStyle; isAnimating: boolean } => {
  const [isAnimating, setIsAnimating] = useState(true)
  const opacity = useSharedValue(0)
  const rotation = useSharedValue(0)

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: FADE_IN_DURATION }),
        withDelay(STAY_DURATION, withTiming(0, { duration: FADE_OUT_DURATION }))
      )
    )
    rotation.value = withDelay(
      delay,
      withTiming(180, {
        duration: ROTATE_DURATION,
        easing: easeOutQuart
      })
    )

    const timeout = setTimeout(() => {
      runOnJS(setIsAnimating)(false)
    }, delay + ROTATE_DURATION)

    return () => clearTimeout(timeout)
  }, [opacity, rotation, delay])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [
      {
        rotate: `${rotation.get()}deg`
      }
    ]
  }))

  return {
    animatedStyle,
    isAnimating
  }
}

const easeOutQuart = (t: number): number => {
  'worklet'
  return 1 - Math.pow(1 - t, 4)
}

const FADE_IN_DURATION = 350
const STAY_DURATION = 500
const FADE_OUT_DURATION = 650
const ROTATE_DURATION = FADE_IN_DURATION + STAY_DURATION + FADE_OUT_DURATION

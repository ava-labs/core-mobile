import { useCallback } from 'react'
import { ViewStyle } from 'react-native'
import {
  AnimatedStyle,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig
} from 'react-native-reanimated'

export function usePopSpringAnimation(
  options: {
    minScale?: number
    inConfig?: WithSpringConfig // shrink spring config
    outConfig?: WithSpringConfig // expand spring config
  } = {}
): {
  animatedStyle: AnimatedStyle<ViewStyle>
  pop: () => void
} {
  const {
    minScale = 0.9,
    inConfig = { damping: 13, stiffness: 120, mass: 1 },
    outConfig = { damping: 13, stiffness: 120, mass: 1 }
  } = options

  const scale = useSharedValue(1)

  // Call this to run the animation once.
  const pop = useCallback(() => {
    // First spring down to minScale, then spring back to 1.
    scale.value = withSpring(minScale, inConfig, () => {
      scale.value = withSpring(1, outConfig)
    })
  }, [minScale, inConfig, outConfig, scale])

  // Apply this style to the target view.
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  return { animatedStyle, pop }
}

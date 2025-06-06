import React, { memo, useCallback } from 'react'
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from 'react-native-reanimated'
import { ANIMATED } from '../../utils'

export const AnimateFadeScale = memo(
  ({ children, delay = 0 }: { children: JSX.Element; delay?: number }) => {
    const opacity = useSharedValue(0)
    const scale = useSharedValue(0.8)

    const animate = useCallback(() => {
      'worklet'
      opacity.value = withDelay(delay, withTiming(1, ANIMATED.TIMING_CONFIG))
      scale.value = withDelay(delay, withSpring(1, ANIMATED.SPRING_CONFIG))
    }, [delay, opacity, scale])

    useAnimatedReaction(
      () => delay,
      () => {
        animate()
      },
      [delay]
    )

    const animatedStyle = useAnimatedStyle(() => {
      return {
        opacity: opacity.value,
        transform: [{ scale: scale.value }]
      }
    }, [opacity, scale])

    return <Animated.View style={animatedStyle}>{children}</Animated.View>
  }
)

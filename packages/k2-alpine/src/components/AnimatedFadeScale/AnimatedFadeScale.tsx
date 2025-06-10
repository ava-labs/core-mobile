import React, { memo, useCallback, useEffect } from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from 'react-native-reanimated'
import { ANIMATED } from '../../utils'

interface AnimateFadeScaleProps {
  children: React.ReactNode
  delay?: number
}

export const AnimateFadeScale = memo(
  ({ children, delay = 0 }: AnimateFadeScaleProps) => {
    const opacity = useSharedValue(0)
    const scale = useSharedValue(0.8)

    const animate = useCallback(() => {
      'worklet'
      opacity.value = withDelay(delay, withTiming(1, ANIMATED.TIMING_CONFIG))
      scale.value = withDelay(delay, withSpring(1, ANIMATED.SPRING_CONFIG))
    }, [delay, opacity, scale])

    useEffect(() => {
      animate()
    }, [animate])

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ scale: scale.value }]
    }))

    return <Animated.View style={animatedStyle}>{children}</Animated.View>
  }
)

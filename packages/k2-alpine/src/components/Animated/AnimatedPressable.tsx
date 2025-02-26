import React, { memo } from 'react'
import { Pressable } from 'dripsy'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated'
import { ANIMATED } from '../../utils'
import { GestureResponderEvent, PressableProps } from 'react-native'

interface AnimatedPressable extends PressableProps {
  children: JSX.Element
}

export const AnimatedPressable = memo(
  ({ children, onPress, ...props }: AnimatedPressable) => {
    const opacity = useSharedValue(1)
    const scale = useSharedValue(1)

    const onPressIn = () => {
      'worklet'
      opacity.value = withTiming(0.5, ANIMATED.TIMING_CONFIG)
      scale.value = withSpring(ANIMATED.SCALE, ANIMATED.SPRING_CONFIG)
    }

    const onPressOut = (event: GestureResponderEvent) => {
      'worklet'
      opacity.value = withTiming(1, ANIMATED.TIMING_CONFIG)
      scale.value = withSpring(1, ANIMATED.SPRING_CONFIG, () => {
        if (onPress) {
          runOnJS(onPress)(event)
        }
      })
    }

    const animatedStyle = useAnimatedStyle(() => {
      return {
        opacity: opacity.value,
        transform: [{ scale: scale.value }]
      }
    })

    return (
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut} {...props}>
        <Animated.View style={[animatedStyle]}>{children}</Animated.View>
      </Pressable>
    )
  }
)

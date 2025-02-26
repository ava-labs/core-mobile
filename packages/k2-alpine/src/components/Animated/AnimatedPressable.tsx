import React, { memo, useCallback } from 'react'
import { GestureResponderEvent, PressableProps } from 'react-native'
import { Pressable } from 'dripsy'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated'
import { throttle } from 'lodash'
import { ANIMATED } from '../../utils'

interface AnimatedPressable extends PressableProps {
  children: JSX.Element
}

const AnimatedPress = Animated.createAnimatedComponent(Pressable)

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
          runOnJS(onPressEvent)(event)
        }
      })
    }

    const onPressEvent = useCallback(
      throttle(
        (event: GestureResponderEvent) => {
          onPress?.(event)
        },
        1000,
        { leading: true, trailing: false }
      ),
      [onPress]
    )

    const animatedStyle = useAnimatedStyle(() => {
      return {
        opacity: opacity.value,
        transform: [{ scale: scale.value }]
      }
    })

    return (
      <AnimatedPress
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        {...props}
        style={[animatedStyle, props.style]}>
        {children}
      </AnimatedPress>
    )
  }
)

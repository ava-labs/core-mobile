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

    const onPressIn = (): void => {
      'worklet'
      opacity.value = withTiming(0.5, ANIMATED.TIMING_CONFIG)
      scale.value = withSpring(ANIMATED.SCALE, ANIMATED.SPRING_CONFIG)
    }

    const onPressOut = (event: GestureResponderEvent): void => {
      'worklet'
      opacity.value = withTiming(1, ANIMATED.TIMING_CONFIG)
      scale.value = withSpring(1, ANIMATED.SPRING_CONFIG, () => {
        if (onPress) {
          runOnJS(onPressEvent)(event)
        }
      })
    }

    const throttledOnPress = throttle(
      event => {
        onPress?.(event)
      },
      1000,
      {
        leading: true,
        trailing: false
      }
    )

    const onPressEvent = useCallback(
      (event: GestureResponderEvent): void => {
        throttledOnPress(event)
      },
      [throttledOnPress]
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
        style={[props.style, animatedStyle]}>
        {children}
      </AnimatedPress>
    )
  }
)

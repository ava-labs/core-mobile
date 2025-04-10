import { Pressable } from 'dripsy'
import { throttle } from 'lodash'
import React, { memo, useCallback, useRef } from 'react'
import {
  GestureResponderEvent,
  InteractionManager,
  PressableProps
} from 'react-native'
import Animated, {
  AnimatedProps,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated'
import { ANIMATED } from '../../utils'

const SCROLL_THRESHOLD = 2 // pixels

export interface AnimatedPressableProps extends AnimatedProps<PressableProps> {
  onPress?: (event: GestureResponderEvent) => void
}

const AnimatedPress = Animated.createAnimatedComponent(Pressable)

export const AnimatedPressable = memo(
  ({ children, onPress, ...props }: AnimatedPressableProps) => {
    const opacity = useSharedValue(1)
    const scale = useSharedValue(1)
    const isScrolling = useRef(false)
    const touchStartPosition = useRef({
      x: 0,
      y: 0
    })

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

    const onPressThrottled = useCallback(
      (event: GestureResponderEvent): void => {
        InteractionManager.runAfterInteractions(() => {
          throttledOnPress(event)
        })
      },
      [throttledOnPress]
    )

    const onPressOut = (event: GestureResponderEvent): void => {
      if (isScrolling.current) {
        resetAnimation()
        return
      }

      endAnimation(event)
    }

    const onTouchStart = (event: GestureResponderEvent): void => {
      if (props.disabled) return
      touchStartPosition.current = {
        x: event.nativeEvent.pageX,
        y: event.nativeEvent.pageY
      }
      isScrolling.current = false

      if (isScrolling.current) {
        return
      }
      if (onPress) startAnimation()
    }

    const onTouchMove = (event: GestureResponderEvent): void => {
      const moveY = Math.abs(
        event.nativeEvent.pageY - touchStartPosition.current.y
      )
      const moveX = Math.abs(
        event.nativeEvent.pageX - touchStartPosition.current.x
      )
      if (moveY > SCROLL_THRESHOLD || moveX > SCROLL_THRESHOLD) {
        isScrolling.current = true
        resetAnimation()
      }
    }

    const startAnimation = (): void => {
      'worklet'
      opacity.value = withTiming(0.5, ANIMATED.TIMING_CONFIG)
      scale.value = withSpring(ANIMATED.SCALE, ANIMATED.SPRING_CONFIG)
    }

    const endAnimation = (event: GestureResponderEvent): void => {
      'worklet'
      opacity.value = withTiming(1, ANIMATED.TIMING_CONFIG)
      scale.value = withSpring(1, ANIMATED.SPRING_CONFIG, () => {
        if (onPress) {
          runOnJS(onPressThrottled)(event)
        }
      })
    }

    const resetAnimation = (): void => {
      'worklet'
      opacity.value = withTiming(1, ANIMATED.TIMING_CONFIG)
      scale.value = withSpring(1, ANIMATED.SPRING_CONFIG)
    }

    const animatedStyle = useAnimatedStyle(() => {
      return {
        opacity: opacity.value,
        transform: [{ scale: scale.value }]
      }
    })

    return (
      <AnimatedPress
        disabled={props.disabled}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onPressOut={onPressOut}
        {...props}
        style={[props.style, animatedStyle]}>
        {children}
      </AnimatedPress>
    )
  }
)

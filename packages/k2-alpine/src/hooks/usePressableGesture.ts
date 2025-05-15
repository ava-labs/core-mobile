import { throttle } from 'lodash'
import { useRef } from 'react'
import { GestureResponderEvent, ViewStyle } from 'react-native'
import { GestureTouchEvent } from 'react-native-gesture-handler'
import {
  AnimatedStyle,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated'
import { ANIMATED } from '../utils'

const SCROLL_THRESHOLD = 1 // pixels

/**
 * Use this hook to handle pressable gestures.
 * @param callback - The callback to call when the gesture is completed.
 * @param props - The props to pass to the component.
 * @returns An object with the animatedStyle, onTouchStart, onTouchMove, onTouchCancel, and onTouchEnd properties.
 *
 * **NOTE** can be used on any component that supports the GestureResponderEvent and GestureTouchEvent props.
 * **EXAMPLE** GestureDetector, Pressable, TouchableOpacity, etc.
 */
export function usePressableGesture(
  callback?: (event: GestureResponderEvent) => void,
  disabled?: boolean
): {
  animatedStyle: AnimatedStyle<ViewStyle>
  onTouchStart: (event: GestureResponderEvent | GestureTouchEvent) => void
  onTouchMove: (event: GestureResponderEvent | GestureTouchEvent) => void
  onTouchEnd: (event: GestureResponderEvent | GestureTouchEvent) => void
  onTouchCancel: () => void
} {
  const opacity = useSharedValue(1)
  const scale = useSharedValue(1)
  const isScrolling = useRef(false)
  const touchStartPosition = useRef({
    x: 0,
    y: 0
  })

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }]
    }
  })

  const throttledCallback = throttle(
    event => {
      callback?.(event)
    },
    1000,
    {
      leading: true,
      trailing: false
    }
  )

  const startAnimation = (): void => {
    'worklet'
    opacity.value = withTiming(0.5, ANIMATED.TIMING_CONFIG)
    scale.value = withSpring(ANIMATED.SCALE, ANIMATED.SPRING_CONFIG)
  }

  const onTouchStart = (
    event: GestureResponderEvent | GestureTouchEvent
  ): void => {
    if (disabled) return
    if ('nativeEvent' in event) {
      touchStartPosition.current = {
        x: event.nativeEvent.pageX,
        y: event.nativeEvent.pageY
      }
    } else {
      if ('allTouches' in event) {
        const x = event?.allTouches?.[0]?.x
        const y = event?.allTouches?.[0]?.y
        if (x !== undefined && y !== undefined) {
          touchStartPosition.current = { x, y }
        }
      } else {
        touchStartPosition.current = { x: 0, y: 0 }
      }
    }

    isScrolling.current = false

    startAnimation()
  }

  const onTouchMove = (
    event: GestureResponderEvent | GestureTouchEvent
  ): void => {
    let moveX = 0
    let moveY = 0
    if ('nativeEvent' in event) {
      moveY = Math.abs(event.nativeEvent.pageY - touchStartPosition.current.y)
      moveX = Math.abs(event.nativeEvent.pageX - touchStartPosition.current.x)
    } else {
      const x = event?.allTouches?.[0]?.x
      const y = event?.allTouches?.[0]?.y

      if (x && y) {
        moveX = Math.abs(x - touchStartPosition.current.x)
        moveY = Math.abs(y - touchStartPosition.current.y)
      }
    }
    if (moveY > SCROLL_THRESHOLD || moveX > SCROLL_THRESHOLD) {
      isScrolling.current = true
      resetAnimation()
    }
  }

  const onTouchCancel = (): void => {
    isScrolling.current = false
    resetAnimation()
  }

  const onTouchEnd = (
    event: GestureResponderEvent | GestureTouchEvent
  ): void => {
    if (isScrolling.current) {
      resetAnimation()
      return
    }
    endAnimation(event)
  }

  const endAnimation = (
    event: GestureResponderEvent | GestureTouchEvent
  ): void => {
    'worklet'
    opacity.value = withTiming(1, ANIMATED.TIMING_CONFIG)
    scale.value = withSpring(1, ANIMATED.SPRING_CONFIG, () => {
      if (callback) {
        runOnJS(throttledCallback)(event)
      }
    })
  }

  const resetAnimation = (): void => {
    'worklet'
    opacity.value = withTiming(1, ANIMATED.TIMING_CONFIG)
    scale.value = withSpring(1, ANIMATED.SPRING_CONFIG)
  }

  return {
    animatedStyle,
    onTouchStart,
    onTouchMove,
    onTouchCancel,
    onTouchEnd
  }
}

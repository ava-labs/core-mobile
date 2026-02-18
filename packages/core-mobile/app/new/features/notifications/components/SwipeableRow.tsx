import React, { ReactNode, useEffect } from 'react'
import { Dimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  interpolate
} from 'react-native-reanimated'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3
const CLEAR_ALL_DURATION = 500 // slower animation for clear all

type SwipeableRowProps = {
  children: ReactNode
  onSwipeComplete: () => void
  onPress?: () => void
  enabled?: boolean
  animateOut?: boolean
  animateDelay?: number
}

const SwipeableRow = ({
  children,
  onSwipeComplete,
  onPress,
  enabled = true,
  animateOut = false,
  animateDelay = 0
}: SwipeableRowProps): JSX.Element => {
  const translateX = useSharedValue(0)

  // Trigger animation when animateOut prop becomes true
  useEffect(() => {
    if (animateOut) {
      const timer = setTimeout(() => {
        translateX.value = withTiming(SCREEN_WIDTH, {
          duration: CLEAR_ALL_DURATION,
          easing: Easing.out(Easing.ease)
        })
      }, animateDelay)
      return () => clearTimeout(timer)
    }
  }, [animateOut, animateDelay, translateX])

  const tapGesture = Gesture.Tap().onEnd(() => {
    if (onPress) {
      runOnJS(onPress)()
    }
  })

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate(event => {
      // Only allow swiping left (negative translationX)
      if (event.translationX < 0) {
        translateX.value = event.translationX
      }
    })
    .onEnd(event => {
      if (event.translationX < -SWIPE_THRESHOLD) {
        // Swipe completed - animate out
        translateX.value = withTiming(
          -SCREEN_WIDTH,
          {
            duration: 200,
            easing: Easing.out(Easing.ease)
          },
          () => {
            runOnJS(onSwipeComplete)()
          }
        )
      } else {
        // Snap back
        translateX.value = withTiming(0, { duration: 200 })
      }
    })
    .enabled(enabled)

  const composedGesture = Gesture.Race(panGesture, tapGesture)

  // Derive opacity from position - fades as item moves away from center
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      Math.abs(translateX.value),
      [0, SCREEN_WIDTH],
      [1, 0]
    )
    return {
      transform: [{ translateX: translateX.value }],
      opacity
    }
  })

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </GestureDetector>
  )
}

export default SwipeableRow

import React, { ReactNode, useRef } from 'react'
import { Pressable, ViewStyle } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { ANIMATED } from '../../utils'

export const Pinchable = ({
  children,
  style,
  onGestureEnd,
  disabled
}: {
  children: ReactNode
  style?: ViewStyle
  disabled?: boolean
  onGestureEnd?: () => void
}): ReactNode => {
  const scale = useSharedValue(1)
  const rotation = useSharedValue(0)
  const isPinching = useRef(false)

  const onUpdate = (): void => {
    if (!isPinching.current) isPinching.current = true
  }

  const onEnd = (): void => {
    if (isPinching.current) {
      isPinching.current = false
      onGestureEnd?.()
    }
  }

  const pinchGesture = Gesture.Pinch()
    .enabled(!disabled)
    .onUpdate(event => {
      scale.value = event.scale > 4 ? 4 : event.scale < 0.8 ? 0.8 : event.scale
      scheduleOnRN(onUpdate)
    })
    .onEnd(() => {
      scale.value = withTiming(1, ANIMATED.TIMING_CONFIG, () => {
        scheduleOnRN(onEnd)
      })
    })

  const rotationGesture = Gesture.Rotation()
    .enabled(!disabled)
    .onUpdate(event => {
      const degrees = (event.rotation * 180) / Math.PI
      rotation.value = degrees >= 360 ? 360 : degrees <= -360 ? -360 : degrees
      scheduleOnRN(onUpdate)
    })
    .onEnd(() => {
      rotation.value = withTiming(0, ANIMATED.TIMING_CONFIG, () => {
        scheduleOnRN(onEnd)
      })
    })

  const composedGesture = Gesture.Simultaneous(pinchGesture, rotationGesture)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }]
  }))

  return (
    <Pressable
      style={style}
      onLongPress={() => {
        isPinching.current = true
      }}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[animatedStyle]}>{children}</Animated.View>
      </GestureDetector>
    </Pressable>
  )
}

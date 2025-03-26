import React, { ReactNode, useRef } from 'react'
import { Pressable, ViewStyle } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated'
import { ANIMATED } from '../../utils'

export const Pinchable = ({
  children,
  style,
  onGestureEnd
}: {
  children: ReactNode
  style?: ViewStyle
  onGestureEnd?: () => void
}): ReactNode => {
  const scale = useSharedValue(1)
  const rotation = useSharedValue(0)
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
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
    .onUpdate(event => {
      scale.value = event.scale > 3 ? 3 : event.scale < 0.8 ? 0.8 : event.scale
      runOnJS(onUpdate)()
    })
    .onEnd(() => {
      scale.value = withSpring(1, ANIMATED.SPRING_CONFIG, () => {
        runOnJS(onEnd)()
      })
    })

  const rotationGesture = Gesture.Rotation()
    .onUpdate(event => {
      const degrees = (event.rotation * 180) / Math.PI
      rotation.value = degrees >= 360 ? 360 : degrees <= -360 ? -360 : degrees
      runOnJS(onUpdate)()
    })
    .onEnd(() => {
      rotation.value = withSpring(0, ANIMATED.SPRING_CONFIG, () => {
        runOnJS(onEnd)()
      })
    })

  // const panGesture = Gesture.Pan()
  //   .onUpdate(event => {
  //     if (event.numberOfPointers > 1) {
  //       translateX.value = event.translationX
  //       translateY.value = event.translationY
  //     }
  //   })
  //   .onEnd(event => {
  //     if (event.numberOfPointers > 1) {
  //       translateX.value = withSpring(0, ANIMATED.SPRING_CONFIG)
  //       translateY.value = withSpring(0, ANIMATED.SPRING_CONFIG, () => {
  //         runOnJS(onEnd)()
  //       })
  //     }
  //   })

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    rotationGesture
    // panGesture
  )

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ]
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

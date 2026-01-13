import { SPRING_LINEAR_TRANSITION } from '@avalabs/k2-alpine'
import React, { useLayoutEffect } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import Animated, {
  Easing,
  FadeInRight,
  FadeInUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated'

export const getItemEnteringAnimation = (index: number): FadeInRight =>
  FadeInRight.duration(100)
    .delay(index * 50)
    .easing(Easing.bezierFn(0.25, 1, 0.5, 1))
    .springify()

export const getListItemEnteringAnimation = (index: number): FadeInUp =>
  FadeInUp.duration(100)
    .delay(index * 50)
    .easing(Easing.bezierFn(0.25, 1, 0.5, 1))
    .springify()

export const AnimatedFadeInUp = ({
  index = 0,
  style,
  children,
  layout,
  ...props
}: {
  index?: number
  style?: StyleProp<ViewStyle>
  layout?: LinearTransition
  children: React.ReactNode
}): JSX.Element => {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)

  useLayoutEffect(() => {
    opacity.value = withDelay(index * 50, withTiming(1, { duration: 300 }))
    translateY.value = withDelay(index * 50, withTiming(0, { duration: 300 }))
  }, [index, opacity, translateY])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }))

  return (
    <Animated.View
      style={[style, animatedStyle]}
      layout={layout ?? SPRING_LINEAR_TRANSITION}
      {...props}>
      {children}
    </Animated.View>
  )
}

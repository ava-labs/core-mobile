import React, { useEffect } from 'react'

import Animated, {
  Easing,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  LinearTransition
} from 'react-native-reanimated'
import { Text } from '../Primitives'

export const PriceChange = ({ formattedPrice }: { formattedPrice: string }) => {
  return (
    <Animated.View
      layout={LinearTransition.springify()}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end'
      }}>
      {formattedPrice
        .toString()
        .split('')
        .map((character, index) => {
          return (
            <AnimateFadeScale key={`${character}-${index}`} delay={index * 30}>
              <Text variant="heading2">{character}</Text>
            </AnimateFadeScale>
          )
        })}
    </Animated.View>
  )
}

export const AnimateFadeScale = ({
  children,
  delay = 0,
  dependency
}: {
  children: JSX.Element
  delay?: number
  dependency?: any
}) => {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.8)

  useEffect(() => {
    animate()
  }, [children, dependency])

  const animate = () => {
    'worklet'
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: 500,
        easing: Easing.bezier(0.25, 1, 0.5, 1)
      })
    )
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 10, stiffness: 200, mass: 0.5 })
    )
  }

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }]
    }
  })

  return (
    <Animated.View
      exiting={FadeOut}
      style={[
        animatedStyle,
        { justifyContent: 'flex-start', alignItems: 'flex-start' }
      ]}>
      {children}
    </Animated.View>
  )
}

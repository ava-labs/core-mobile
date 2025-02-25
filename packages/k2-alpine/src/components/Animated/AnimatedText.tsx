import React, { useEffect } from 'react'

import Animated, { LinearTransition } from 'react-native-reanimated'
import { Text } from '../Primitives'
import {
  Easing,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from 'react-native-reanimated'

export const AnimatedText = ({ characters }: { characters: string }) => {
  return (
    <Animated.View
      layout={LinearTransition.springify()}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end'
      }}>
      {characters
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
  delay = 0
}: {
  children: JSX.Element
  delay?: number
}) => {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.8)

  useEffect(() => {
    animate()
  }, [children])

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

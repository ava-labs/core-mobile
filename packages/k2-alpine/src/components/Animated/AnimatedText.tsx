import React, { useEffect } from 'react'

import { SxProp } from 'dripsy'
import { LayoutChangeEvent } from 'react-native'
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from 'react-native-reanimated'
import { TextVariant } from '../../theme/tokens/text'
import { Text } from '../Primitives'

export const AnimatedText = ({
  variant = 'heading2',
  characters,
  sx,
  onLayout
}: {
  characters: string
  variant?: TextVariant
  sx?: SxProp
  onLayout?: (event: LayoutChangeEvent) => void
}) => {
  return (
    <Animated.View
      layout={LinearTransition.springify()}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end'
      }}
      onLayout={onLayout}>
      {characters
        .toString()
        .split('')
        .map((character, index) => {
          return (
            <AnimateFadeScale key={`${character}-${index}`} delay={index * 30}>
              <Text variant={variant} sx={sx}>
                {character}
              </Text>
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
  }, [])

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
  }, [])

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={[
        animatedStyle,
        { justifyContent: 'flex-start', alignItems: 'flex-start' }
      ]}>
      {children}
    </Animated.View>
  )
}

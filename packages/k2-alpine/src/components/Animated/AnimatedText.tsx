import React, { memo, useCallback, useEffect } from 'react'

import { SxProp } from 'dripsy'
import { LayoutChangeEvent } from 'react-native'
import Animated, {
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
import { ANIMATED } from '../../utils'
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
}): JSX.Element => {
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

export const AnimateFadeScale = memo(
  ({ children, delay = 0 }: { children: JSX.Element; delay?: number }) => {
    const opacity = useSharedValue(0)
    const scale = useSharedValue(0.8)

    const animate = useCallback(() => {
      'worklet'
      opacity.value = withDelay(delay, withTiming(1, ANIMATED.TIMING_CONFIG))
      scale.value = withDelay(delay, withSpring(1, ANIMATED.SPRING_CONFIG))
    }, [delay, opacity, scale])

    useEffect(() => {
      animate()
    }, [animate])

    const animatedStyle = useAnimatedStyle(() => {
      return {
        opacity: opacity.get(),
        transform: [{ scale: scale.get() }]
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
)

import {
  StackCardInterpolatedStyle,
  StackCardInterpolationProps
} from '@react-navigation/stack'
import { Animated } from 'react-native'

/**
 * Custom card transition interpolator for modal presentations.
 *
 * This function defines the animations for modal screens, making them slide in
 * from the bottom and adding an overlay fade effect. It calculates the progress
 * of the transition between screens and applies vertical translation and opacity
 * to achieve smooth animations.
 *
 * This is different from CardStyleInterpolators.forModalPresentationIOS
 */
export function forModalPresentationIOS({
  current,
  next,
  inverted,
  layouts: { screen }
}: StackCardInterpolationProps): StackCardInterpolatedStyle {
  const progress = Animated.add(
    current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp'
    }),
    next
      ? next.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp'
        })
      : 0
  )

  const translateX = Animated.multiply(
    progress.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [screen.width, 0, 0]
    }),
    inverted
  )

  const overlayOpacity = progress.interpolate({
    inputRange: [0, 1, 1.0001, 2],
    outputRange: [0, 0.5, 0.5, 0.5]
  })

  return {
    cardStyle: {
      overflow: 'hidden',
      paddingTop: 0,
      transform: [{ translateX }]
    },
    overlayStyle: { opacity: overlayOpacity }
  }
}

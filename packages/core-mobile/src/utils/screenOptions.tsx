import React from 'react'
import {
  StackCardInterpolatedStyle,
  StackCardInterpolationProps,
  StackNavigationOptions,
  TransitionPresets
} from '@react-navigation/stack'
import { Animated } from 'react-native'
import Grabber from 'components/navigation/Grabber'
import BackBarButton from 'components/navigation/BackBarButton'

// common screen options for stack navigators
// these options are used in the most stack navigators of the app
export const stackNavigatorScreenOptions: StackNavigationOptions = {
  title: '',
  headerBackTitleVisible: false,
  headerShadowVisible: false,
  headerTitleAlign: 'center',
  headerBackImage: () => <BackBarButton />,
  ...TransitionPresets.SlideFromRightIOS
}

// common screen options for stack navigators with modal presentation
// these options are used in the modal stack navigators, having a grabber in the header
export const modalStackNavigatorScreenOptions: StackNavigationOptions = {
  ...stackNavigatorScreenOptions,
  headerTitle: () => <Grabber />
}

// common screen options for modal screen
// these options are used in the modal screens, having a modal presentation animation and customized card style
export const modalScreensOptions: StackNavigationOptions = {
  presentation: 'modal',
  cardStyle: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: 75
  },
  gestureEnabled: true,
  gestureDirection: 'vertical',
  cardStyleInterpolator: cardStyleInterpolatorForModalPresentation
}

/**
 * Custom card transition interpolator for modal presentations.
 *
 * This function defines the animations for modal screens, making them slide in
 * from the bottom and adding an overlay fade effect. It calculates the progress
 * of the transition between screens and applies vertical translation and opacity
 * to achieve smooth animations.
 */
function cardStyleInterpolatorForModalPresentation({
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

  const translateY = Animated.multiply(
    progress.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [screen.height, 0, 0]
    }),
    inverted
  )

  const overlayOpacity = progress.interpolate({
    inputRange: [0, 1, 1.0001, 2],
    outputRange: [0, 0.5, 1, 1]
  })

  return {
    cardStyle: {
      overflow: 'hidden',
      transform: [{ translateY }]
    },
    overlayStyle: { opacity: overlayOpacity }
  }
}

export const modalFirstScreenOptions: StackNavigationOptions = {
  headerBackImage: () => null
}

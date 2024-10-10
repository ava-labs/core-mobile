import {
  StackCardInterpolatedStyle,
  StackCardInterpolationProps,
  StackNavigationOptions
} from '@react-navigation/stack'
import { Animated } from 'react-native'
import React from 'react'
import Grabber from 'components/Grabber'
import BackBarButton from 'components/BackBarButton'

export const modalStackNavigatorScreenOptions: StackNavigationOptions = {
  title: '',
  headerBackTitleVisible: false,
  headerTitle: () => <Grabber />,
  headerShadowVisible: false,
  headerTitleAlign: 'center',
  headerBackImage: () => <BackBarButton />
}

export const modalScreensOptions: StackNavigationOptions = {
  presentation: 'modal',
  cardStyle: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: 75
  },
  gestureEnabled: true,
  gestureDirection: 'vertical',
  cardStyleInterpolator: forModalPresentationIOS
}

function forModalPresentationIOS({
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

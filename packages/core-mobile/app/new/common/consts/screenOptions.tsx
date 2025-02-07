import React from 'react'
import {
  StackCardInterpolatedStyle,
  StackCardInterpolationProps,
  StackNavigationOptions,
  TransitionPresets
} from '@react-navigation/stack'
import { Animated } from 'react-native'
import Grabber from 'common/components/Grabber'
import BackBarButton from 'common/components/BackBarButton'
import BlurredBackgroundView from 'common/components/BlurredBackgroundView'
import { View } from '@avalabs/k2-alpine'
import { Link } from 'expo-router'
import { ReceiveBarButton } from 'common/components/ReceiveBarButton'
import { NotificationBarButton } from 'common/components/NotificationBarButton'
import { AccountSettingBarButton } from 'common/components/AccountSettingBarButton'

const commonNavigatorScreenOptions: StackNavigationOptions = {
  title: '',
  headerBackTitleVisible: false,
  headerShadowVisible: false,
  headerTitleAlign: 'center',
  headerBackImage: () => <BackBarButton />,
  ...TransitionPresets.SlideFromRightIOS
}

export const stackNavigatorScreenOptions: StackNavigationOptions = {
  ...commonNavigatorScreenOptions,
  headerTransparent: true,
  headerBackground: () => <BlurredBackgroundView />
}

export const modalStackNavigatorScreenOptions: StackNavigationOptions = {
  ...commonNavigatorScreenOptions,
  headerTitle: () => <Grabber />
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

/**
 * Custom card transition interpolator for modal presentations.
 *
 * This function defines the animations for modal screens, making them slide in
 * from the bottom and adding an overlay fade effect. It calculates the progress
 * of the transition between screens and applies vertical translation and opacity
 * to achieve smooth animations.
 */
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

// Options for the first screen of a modal stack navigator.
// This screen does not have a back button, so we need to hide it.
export const modalFirstScreenOptions: StackNavigationOptions = {
  headerBackImage: () => null
}

export const homeScreenOptions: StackNavigationOptions = {
  headerLeft: () => (
    <View
      sx={{
        marginLeft: 12,
        height: '100%',
        justifyContent: 'center'
      }}>
      <Link href="/settings/">
        <AccountSettingBarButton />
      </Link>
    </View>
  ),
  headerRight: () => {
    return (
      <View
        sx={{
          flexDirection: 'row',
          gap: 12,
          marginRight: 12,
          height: '100%',
          alignItems: 'center'
        }}>
        <Link href="/receive/" asChild>
          <ReceiveBarButton />
        </Link>
        <Link href="/notifications/" asChild>
          <NotificationBarButton />
        </Link>
      </View>
    )
  },
  animationEnabled: false
}

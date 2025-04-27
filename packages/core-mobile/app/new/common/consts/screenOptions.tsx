import React from 'react'
import {
  CardStyleInterpolators,
  StackCardInterpolatedStyle,
  StackCardInterpolationProps,
  StackNavigationOptions,
  TransitionPresets
} from '@react-navigation/stack'
import { Animated, Platform } from 'react-native'
import BackBarButton from 'common/components/BackBarButton'
import BlurredBackgroundView from 'common/components/BlurredBackgroundView'
import { View } from '@avalabs/k2-alpine'
import { Link } from 'expo-router'
import { ReceiveBarButton } from 'common/components/ReceiveBarButton'
//import { NotificationBarButton } from 'common/components/NotificationBarButton'
import { AccountSettingBarButton } from 'common/components/AccountSettingBarButton'

const BAR_BUTTONS_BOTTOM_MARGIN = Platform.OS === 'ios' ? 8 : 0

const MODAL_TOP_MARGIN = Platform.OS === 'ios' ? 75 : 35
const MODAL_BORDER_RADIUS = 40
const MODAL_HEADER_HEIGHT = 72

const commonNavigatorScreenOptions: StackNavigationOptions = {
  title: '',
  headerBackButtonDisplayMode: 'minimal',
  headerShadowVisible: false,
  headerTitleAlign: 'center',
  headerBackImage: () => <BackBarButton />,
  ...TransitionPresets.SlideFromRightIOS
}

export const stackNavigatorScreenOptions: StackNavigationOptions = {
  ...commonNavigatorScreenOptions,
  headerTransparent: true
}

export const modalStackNavigatorScreenOptions: StackNavigationOptions = {
  ...commonNavigatorScreenOptions,
  headerBackground: () => <BlurredBackgroundView hasGrabber={true} />,
  headerStyle: {
    height: MODAL_HEADER_HEIGHT
  },
  // on iOS,we need to set headerStatusBarHeight to 0 to
  // prevent the header from jumping when navigating
  ...(Platform.OS === 'ios' && { headerStatusBarHeight: 0 })
}

export const modalScreensOptions: StackNavigationOptions = {
  presentation: 'modal',
  cardStyle: {
    marginTop: MODAL_TOP_MARGIN,
    borderTopLeftRadius: MODAL_BORDER_RADIUS,
    borderTopRightRadius: MODAL_BORDER_RADIUS
  },
  gestureEnabled: true,
  gestureDirection: 'vertical',
  headerShown: false,

  // we are using a custom modal transition interpolator
  // to match design
  cardStyleInterpolator: forModalPresentationIOS
}

export const formSheetScreensOptions: StackNavigationOptions = {
  presentation: 'modal',
  cardStyle: {
    marginTop: MODAL_TOP_MARGIN,
    borderTopLeftRadius: MODAL_BORDER_RADIUS,
    borderTopRightRadius: MODAL_BORDER_RADIUS
  },
  gestureEnabled: true,
  gestureDirection: 'vertical',

  // we patched @react-navigation/stack to support a custom "formSheet" effect
  // for modals on both iOS and Android
  cardStyleInterpolator: CardStyleInterpolators.forModalPresentationIOS
}

// Options for the first screen of a modal stack navigator.
// This screen does not have a back button, so we need to hide it.
export const modalFirstScreenOptions: StackNavigationOptions = {
  headerBackImage: () => null
}

const HeaderBack = (): JSX.Element => (
  <View sx={{ marginTop: 39 }}>
    <BackBarButton />
  </View>
)

export const modalScreenOptionsWithHeaderBack: StackNavigationOptions = {
  headerBackImage: HeaderBack
}

export const homeScreenOptions: StackNavigationOptions = {
  headerLeft: () => (
    <View
      sx={{
        marginLeft: 14,
        marginBottom: BAR_BUTTONS_BOTTOM_MARGIN,
        alignItems: 'center'
      }}>
      <Link href="/accountSettings/" asChild>
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
          marginRight: 14,
          marginBottom: BAR_BUTTONS_BOTTOM_MARGIN,
          alignItems: 'center'
        }}>
        <Link href="/receive/" asChild>
          <ReceiveBarButton />
        </Link>
        {/* <Link href="/notifications/" asChild>
          <NotificationBarButton />
        </Link> */}
      </View>
    )
  },
  animation: 'none'
}

export function forNoAnimation(): StackCardInterpolatedStyle {
  return {}
}

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
    outputRange: [0, 0.5, 0.5, 0.5]
  })

  return {
    cardStyle: {
      overflow: 'hidden',
      transform: [{ translateY }]
    },
    overlayStyle: { opacity: overlayOpacity }
  }
}

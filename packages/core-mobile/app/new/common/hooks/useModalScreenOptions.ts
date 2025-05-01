import {
  StackCardInterpolatedStyle,
  StackCardInterpolationProps,
  StackNavigationOptions
} from '@react-navigation/stack'
import { useMemo } from 'react'
import { Animated, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const MODAL_TOP_MARGIN = Platform.OS === 'ios' ? 77 : 35
export const MODAL_BORDER_RADIUS = 40
export const MODAL_HEADER_HEIGHT = 62

export function useModalScreenOptions(): {
  modalScreensOptions: StackNavigationOptions
  topMarginOffset: number
} {
  const insets = useSafeAreaInsets()

  const topMarginOffset = useMemo(() => {
    if (Platform.OS === 'android') {
      return insets.top + MODAL_TOP_MARGIN
    }
    return MODAL_TOP_MARGIN
  }, [insets])

  const modalScreensOptions: StackNavigationOptions = {
    presentation: 'modal',
    cardStyle: {
      marginTop: topMarginOffset,
      borderTopLeftRadius: MODAL_BORDER_RADIUS,
      borderTopRightRadius: MODAL_BORDER_RADIUS
    },
    gestureEnabled: true,
    gestureDirection: 'vertical',
    headerShown: false,
    headerStyle: {
      height: MODAL_HEADER_HEIGHT
    },

    // we are using a custom modal transition interpolator
    // to match design
    cardStyleInterpolator: forModalPresentationIOS
  }

  return {
    modalScreensOptions,
    topMarginOffset
  }
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

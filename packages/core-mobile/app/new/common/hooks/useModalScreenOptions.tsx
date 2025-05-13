import {
  CardStyleInterpolators,
  StackCardInterpolatedStyle,
  StackCardInterpolationProps,
  StackNavigationOptions
} from '@react-navigation/stack'
import {
  MODAL_BORDER_RADIUS,
  MODAL_HEADER_HEIGHT,
  MODAL_TOP_MARGIN,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { useMemo } from 'react'
import { Animated, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as stackModalInterpolator from '../utils/stackModalInterpolator'

export function useModalScreenOptions(): {
  topMarginOffset: number
  modalScreensOptions: StackNavigationOptions
  formSheetScreensOptions: StackNavigationOptions
  modalStackNavigatorScreenOptions: StackNavigationOptions
  modalFirstScreenOptions: StackNavigationOptions
  // When opening a modal from a stacked navigator which is itself a modal we need to use a different effect
  // This is because the modal effect is not supported on Android and the screen zIndex is not respected
  // Use this when you have a detail screen that has to be on top of the tabbar
  // Ex: TokenDetail/CollectibleDetail screen which opens a modal
  stackModalScreensOptions: StackNavigationOptions | undefined
} {
  const insets = useSafeAreaInsets()

  const topMarginOffset = useMemo(() => {
    return insets.top + MODAL_TOP_MARGIN
  }, [insets])

  const modalOptions: StackNavigationOptions = {
    presentation: 'modal',
    cardStyle: {
      marginTop: topMarginOffset,
      borderTopLeftRadius: MODAL_BORDER_RADIUS,
      borderTopRightRadius: MODAL_BORDER_RADIUS,
      zIndex: 1000
    },
    gestureEnabled: true,
    // Make the whole screen gestureable for dismissing the modal
    // This breaks keyboard open interaction on Android
    // Does work for Android when inside a scrollable screen if content height isn't greater than screen height
    // Does not work for iOS when inside a scrollable screen only if scrollEnabled is false
    // gestureResponseDistance: SCREEN_HEIGHT,
    headerStyle: {
      height: MODAL_HEADER_HEIGHT
    }
  }

  const modalScreensOptions: StackNavigationOptions = {
    ...modalOptions,
    cardStyleInterpolator: forModalPresentationIOS
  }

  const formSheetScreensOptions: StackNavigationOptions = {
    ...modalOptions,
    cardStyle: {
      marginTop: Platform.OS === 'ios' ? topMarginOffset - 4 : MODAL_TOP_MARGIN,
      borderTopLeftRadius: MODAL_BORDER_RADIUS,
      borderTopRightRadius: MODAL_BORDER_RADIUS
    },
    // we patched @react-navigation/stack to support a custom "formSheet" effect
    // for modals on both iOS and Android
    cardStyleInterpolator: CardStyleInterpolators.forModalPresentationIOS
  }

  const stackModalScreensOptions: StackNavigationOptions | undefined =
    Platform.OS === 'android'
      ? {
          presentation: 'card',
          gestureDirection: 'horizontal',
          gestureEnabled: true,
          cardStyle: {
            marginTop: 0,
            paddingTop: insets.top
          },
          cardStyleInterpolator: stackModalInterpolator.forModalPresentationIOS
        }
      : {
          cardStyle: {
            marginTop: 0,
            paddingTop: 0
          }
        }

  // Options for the first screen of a modal stack navigator.
  // This screen does not have a back button, so we need to hide it.
  const modalFirstScreenOptions: StackNavigationOptions = {
    headerBackImage: () => null
  }

  return {
    modalScreensOptions,
    formSheetScreensOptions,
    modalStackNavigatorScreenOptions,
    topMarginOffset,
    modalFirstScreenOptions,
    stackModalScreensOptions
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

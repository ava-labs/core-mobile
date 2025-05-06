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

// const CardOverlay = ({
//   style
// }: {
//   style: Animated.WithAnimatedValue<StyleProp<ViewStyle>>
// }): JSX.Element => {
//   return (
//     <Animated.View
//       style={[
//         style,
//         {
//           opacity: 1,
//           backgroundColor: 'red',
//           height: StyleSheet.absoluteFill,
//           width: StyleSheet.absoluteFill
//         }
//       ]}
//     />
//   )
// }
export function useModalScreenOptions(): {
  topMarginOffset: number
  modalScreensOptions: StackNavigationOptions
  formSheetScreensOptions: StackNavigationOptions
  modalStackNavigatorScreenOptions: StackNavigationOptions
  modalFirstScreenOptions: StackNavigationOptions
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
    headerShown: false,
    cardOverlayEnabled: true,
    headerStyle: {
      height: MODAL_HEADER_HEIGHT
    }
  }

  const modalScreensOptions: StackNavigationOptions = {
    ...modalOptions,
    cardStyleInterpolator:
      Platform.OS === 'ios'
        ? forModalPresentationIOS
        : CardStyleInterpolators.forBottomSheetAndroid
  }

  const formSheetScreensOptions: StackNavigationOptions = {
    ...modalOptions,
    cardStyle: {
      marginTop: topMarginOffset + 24,
      borderTopLeftRadius: MODAL_BORDER_RADIUS,
      borderTopRightRadius: MODAL_BORDER_RADIUS
    },
    // we patched @react-navigation/stack to support a custom "formSheet" effect
    // for modals on both iOS and Android
    cardStyleInterpolator:
      Platform.OS === 'ios'
        ? forModalPresentationIOS
        : CardStyleInterpolators.forBottomSheetAndroid
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
    modalFirstScreenOptions
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
      transform: [{ translateY }],
      zIndex: 1000
    },
    overlayStyle: { opacity: overlayOpacity }
  }
}

// function forBottomSheetAndroid({
//   current,
//   inverted,
//   layouts: { screen },
//   closing
// }: StackCardInterpolationProps): StackCardInterpolatedStyle {
//   const translateY = Animated.multiply(
//     current.progress.interpolate({
//       inputRange: [0, 1],
//       outputRange: [screen.height * 0.8, 0],
//       extrapolate: 'clamp'
//     }),
//     inverted
//   )

//   const overlayOpacity = current.progress.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0, 0.3],
//     extrapolate: 'clamp'
//   })

//   return {
//     cardStyle: {
//       transform: [{ translateY }]
//     },
//     overlayStyle: { opacity: overlayOpacity }
//   }
// }

import { NativeStackNavigationOptions } from '@react-navigation/native-stack'
// import BackBarButton from 'common/components/BackBarButton'
import BlurredBackgroundView from 'common/components/BlurredBackgroundView'
import React from 'react'
import { Platform } from 'react-native'

export const MODAL_TOP_MARGIN = 28
export const MODAL_BORDER_RADIUS = 40
export const MODAL_HEADER_HEIGHT = 62

export const commonNavigatorScreenOptions: NativeStackNavigationOptions = {
  title: '',
  headerBackButtonDisplayMode: 'minimal',
  headerShadowVisible: false,
  headerTitleAlign: 'center'
  // headerBackImage: () => <BackBarButton />,
  // ...TransitionPresets.SlideFromRightIOS
}

export const stackNavigatorScreenOptions: NativeStackNavigationOptions = {
  ...commonNavigatorScreenOptions,
  headerTransparent: true
}

export const modalStackNavigatorScreenOptions: NativeStackNavigationOptions = {
  ...commonNavigatorScreenOptions,
  headerBackground: () => <BlurredBackgroundView hasGrabber={true} />,
  // headerBackImage: () => <BackBarButton isModal />,
  headerTransparent: true,
  // headerStyle: {
  //   height: MODAL_HEADER_HEIGHT
  // },
  // on iOS,we need to set headerStatusBarHeight to 0 to
  // prevent the header from jumping when navigating
  ...(Platform.OS === 'ios' && { headerStatusBarHeight: 0 })
}

export const modalScreenOptionsWithHeaderBack: NativeStackNavigationOptions = {
  // headerBackImage: () => <BackBarButton isModal />
}

// export function forNoAnimation(): NativeStackCardInterpolatedStyle {
//   return {}
// }

// export const androidModalTransitionSpec = {
//   open: TransitionSpecs.BottomSheetSlideInSpec,
//   close: {
//     animation: 'timing',
//     config: { duration: 0 }
//   } as TransitionSpec
// }

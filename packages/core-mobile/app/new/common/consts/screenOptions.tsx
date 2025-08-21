import { NativeStackNavigationOptions } from '@react-navigation/native-stack'
import BackBarButton from 'common/components/BackBarButton'
import BlurredBackgroundView from 'common/components/BlurredBackgroundView'
import React from 'react'
import { Platform } from 'react-native'

export const MODAL_TOP_MARGIN = 28
export const MODAL_BORDER_RADIUS = 40
export const MODAL_HEADER_HEIGHT = 62

export const commonNavigatorScreenOptions: NativeStackNavigationOptions = {
  title: '',
  headerTitleAlign: 'center',
  headerBackButtonDisplayMode: 'minimal'
}

export const stackNavigatorScreenOptions: NativeStackNavigationOptions = {
  ...commonNavigatorScreenOptions,
  headerTransparent: true,
  animation: 'slide_from_right',
  headerTitleAlign: 'center'
}

export const stackModalScreensOptions:
  | NativeStackNavigationOptions
  | undefined = {
  headerBackButtonDisplayMode: 'minimal',
  headerTransparent: true,
  headerTitleAlign: 'center',
  animation: 'slide_from_right',
  headerLeft: () => <BackBarButton />
}

export const modalStackNavigatorScreenOptions: NativeStackNavigationOptions = {
  ...commonNavigatorScreenOptions,
  headerTransparent: true,
  headerTitleAlign: 'center',
  sheetGrabberVisible: true,
  headerBackground: () => <BlurredBackgroundView hasGrabber={true} />
}

export const modalScreensOptions: NativeStackNavigationOptions = {
  // TODO: Figure out why this doesn't work for iOS
  // the content is not visible when formSheet is open
  // https://reactnavigation.org/docs/native-stack-navigator/#using-form-sheet
  // this also helps with borderRadius on iOS and opening height
  // presentation: 'formSheet',
  // sheetCornerRadius: 20,
  presentation: Platform.OS === 'android' ? 'formSheet' : 'modal',
  ...(Platform.OS === 'android' && {
    sheetAllowedDetents: [0.94]
  }),
  gestureEnabled: true,
  sheetGrabberVisible: true,
  headerLeft: () => <BackBarButton />
}

export const formSheetScreensOptions: NativeStackNavigationOptions = {
  ...modalScreensOptions,
  ...(Platform.OS === 'android' && {
    sheetAllowedDetents: [0.91]
  })
}

// Options for the first screen of a modal stack navigator.
// This screen does not have a back button, so we need to hide it.
export const modalFirstScreenOptions: NativeStackNavigationOptions = {
  headerBackVisible: false,
  headerTitleAlign: 'center',
  sheetGrabberVisible: true,
  headerLeft: () => null
}

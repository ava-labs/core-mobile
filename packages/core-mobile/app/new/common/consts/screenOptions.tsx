import { NativeStackNavigationOptions } from '@react-navigation/native-stack'
import BackBarButton from 'common/components/BackBarButton'
import BlurredBackgroundView from 'common/components/BlurredBackgroundView'
import React from 'react'
import { Platform } from 'react-native'

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

export const modalStackNavigatorScreenOptions: NativeStackNavigationOptions = {
  ...commonNavigatorScreenOptions,
  headerBackground: () => <BlurredBackgroundView hasGrabber={true} />,
  headerTransparent: true,
  headerTitleAlign: 'center',
  sheetGrabberVisible: true,
  headerLeft: () => <BackBarButton />
}

export const stackModalScreensOptions:
  | NativeStackNavigationOptions
  | undefined = {
  headerLeft: () => <BackBarButton />,
  headerBackButtonDisplayMode: 'minimal',
  headerTransparent: true,
  headerTitleAlign: 'center',
  animation: 'slide_from_right'
}

// Modals

export const modalScreensOptions: NativeStackNavigationOptions = {
  // TODO: Figure out why this doesn't work for iOS
  // the content is not visible when formSheet is open
  // https://reactnavigation.org/docs/native-stack-navigator/#using-form-sheet
  // this also helps with borderRadius on iOS and opening height
  // presentation: 'formSheet',
  // sheetCornerRadius: 20,
  presentation: Platform.OS === 'android' ? 'formSheet' : 'pageSheet',
  // presentation: 'formSheet',
  headerBackButtonDisplayMode: 'minimal',
  sheetCornerRadius: 20,
  ...(Platform.OS === 'android' && {
    sheetAllowedDetents: [0.94]
  }),
  gestureEnabled: true,
  sheetGrabberVisible: true,
  headerLeft: () => <BackBarButton />
}

// Options for the first screen of a modal stack navigator.
// This screen does not have a back button, so we need to hide it.
export const modalFirstScreenOptions: NativeStackNavigationOptions = {
  headerBackVisible: false,
  sheetGrabberVisible: true,
  headerTitleAlign: 'center',
  headerLeft: () => null
}

export const formSheetScreensOptions: NativeStackNavigationOptions = {
  ...modalScreensOptions,
  ...(Platform.OS === 'android' && {
    sheetAllowedDetents: [0.91]
  })
}

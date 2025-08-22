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
  presentation: 'formSheet',
  headerBackButtonDisplayMode: 'minimal',
  sheetCornerRadius: 24,
  sheetAllowedDetents: [Platform.OS === 'android' ? 0.94 : 0.99],
  gestureEnabled: true,
  sheetGrabberVisible: true,
  headerLeft: () => <BackBarButton />,
  contentStyle: {
    // iOS will display empty content without this
    height: '100%'
  }
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
  presentation: Platform.OS === 'android' ? 'formSheet' : 'pageSheet',
  sheetAllowedDetents: [0.91]
}

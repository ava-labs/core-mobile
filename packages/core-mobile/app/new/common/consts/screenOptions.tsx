import { NativeStackNavigationOptions } from '@react-navigation/native-stack'
import BackBarButton from 'common/components/BackBarButton'
import React from 'react'
import { Platform } from 'react-native'

export const commonNavigatorScreenOptions: NativeStackNavigationOptions = {
  title: '',
  headerTitleAlign: 'center',
  headerBackButtonDisplayMode: 'minimal'
}

// Stacks
export const stackNavigatorScreenOptions: NativeStackNavigationOptions = {
  ...commonNavigatorScreenOptions,
  headerTransparent: true,
  animation: 'slide_from_right'
}

export const stackScreensOptions: NativeStackNavigationOptions | undefined = {
  title: '',
  headerLeft: () => <BackBarButton />,
  headerBackButtonDisplayMode: 'minimal',
  headerTransparent: true,
  headerTitleAlign: 'center',
  animation: 'slide_from_right'
}

// Modals
export const modalScreensOptions: NativeStackNavigationOptions = {
  presentation: Platform.OS === 'ios' ? 'pageSheet' : 'formSheet',
  sheetElevation: 48,
  headerBackButtonDisplayMode: 'minimal',
  sheetAllowedDetents: [Platform.OS === 'android' ? 0.93 : 0.99],
  headerLeft: () => <BackBarButton />,
  gestureEnabled: true,
  sheetGrabberVisible: true,
  headerTransparent: true,
  headerTitleAlign: 'center',
  title: '',
  headerStyle: {
    backgroundColor: 'transparent'
  },
  contentStyle: {
    // iOS will display empty content without this
    height: '100%',
    marginTop: 0, // remove extra top spacing
    paddingTop: 0
  }
}

export const modalStackNavigatorScreenOptions: NativeStackNavigationOptions = {
  ...modalScreensOptions,
  presentation: 'card'
}

export const formSheetScreensOptions: NativeStackNavigationOptions = {
  ...modalScreensOptions,
  presentation: Platform.OS === 'ios' ? 'pageSheet' : 'formSheet',
  sheetAllowedDetents: [Platform.OS === 'android' ? 0.92 : 0.99]
}

// Options for the first screen of a modal stack navigator.
// This screen does not have a back button, so we need to hide it.
export const modalFirstScreenOptions: NativeStackNavigationOptions = {
  headerBackVisible: false,
  sheetGrabberVisible: true,
  headerTitleAlign: 'center',
  headerLeft: () => null
}

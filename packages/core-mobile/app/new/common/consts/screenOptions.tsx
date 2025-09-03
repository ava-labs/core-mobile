import { NativeStackNavigationOptions } from '@react-navigation/native-stack'
import BackBarButton from 'common/components/BackBarButton'
import React from 'react'
import { Platform } from 'react-native'

export const TAB_BAR_HEIGHT = 60

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
  ...stackNavigatorScreenOptions,
  headerLeft: () => <BackBarButton />,
  headerTransparent: true,
  headerTitleAlign: 'center',
  animation: 'slide_from_right'
}

// Modals
export const modalScreensOptions: NativeStackNavigationOptions = {
  ...commonNavigatorScreenOptions,
  presentation: Platform.OS === 'ios' ? 'pageSheet' : 'formSheet',
  sheetAllowedDetents: [Platform.OS === 'android' ? 0.93 : 0.99],
  headerLeft: () => <BackBarButton />,
  gestureEnabled: true,
  headerTransparent: true,
  ...(Platform.OS === 'ios' && {
    // iOS will display empty content without this
    contentStyle: {
      height: '100%'
    }
  })
}

export const secondaryModalScreensOptions: NativeStackNavigationOptions = {
  ...modalScreensOptions,
  sheetAllowedDetents: [Platform.OS === 'android' ? 0.92 : 0.99]
}

export const modalStackNavigatorScreenOptions: NativeStackNavigationOptions = {
  ...modalScreensOptions,
  headerTransparent: true,
  presentation: 'card'
}

// Options for the first screen of a modal stack navigator.
// This screen does not have a back button, so we need to hide it.
export const modalFirstScreenOptions: NativeStackNavigationOptions = {
  ...commonNavigatorScreenOptions,
  headerBackVisible: false,
  headerLeft: () => null
}

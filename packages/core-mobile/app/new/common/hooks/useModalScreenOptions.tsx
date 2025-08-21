import { NativeStackNavigationOptions } from '@react-navigation/native-stack'
import React from 'react'
import BackBarButton from 'common/components/BackBarButton'

import { modalStackNavigatorScreenOptions } from 'common/consts/screenOptions'
import { Platform } from 'react-native'

export function useModalScreenOptions(): {
  modalScreensOptions: NativeStackNavigationOptions
  formSheetScreensOptions: NativeStackNavigationOptions
  modalStackNavigatorScreenOptions: NativeStackNavigationOptions
  modalFirstScreenOptions: NativeStackNavigationOptions
  // When opening a modal from a stacked navigator which is itself a modal we need to use a different effect
  // This is because the modal effect is not supported on Android and the screen zIndex is not respected
  // Use this when you have a detail screen that has to be on top of the tabbar
  // Ex: TokenDetail/CollectibleDetail screen which opens a modal
  stackModalScreensOptions: NativeStackNavigationOptions | undefined
} {
  const modalOptions: NativeStackNavigationOptions = {
    presentation: Platform.OS === 'android' ? 'formSheet' : 'pageSheet',
    // presentation: 'formSheet',
    headerBackButtonDisplayMode: 'minimal',
    sheetCornerRadius: 20,
    ...(Platform.OS === 'android' && {
      sheetAllowedDetents: [0.94]
    }),
    gestureEnabled: true,
    sheetGrabberVisible: true
  }

  const modalScreensOptions: NativeStackNavigationOptions = {
    ...modalOptions
  }

  const formSheetScreensOptions: NativeStackNavigationOptions = {
    ...modalOptions,
    ...(Platform.OS === 'android' && {
      sheetAllowedDetents: [0.91]
    })
  }

  const stackModalScreensOptions: NativeStackNavigationOptions | undefined = {
    presentation: 'card',
    headerLeft: () => <BackBarButton />,
    headerBackButtonDisplayMode: 'minimal',
    headerTransparent: true,
    animation: 'slide_from_right'
  }

  // Options for the first screen of a modal stack navigator.
  // This screen does not have a back button, so we need to hide it.
  const modalFirstScreenOptions: NativeStackNavigationOptions = {
    headerBackVisible: false,
    sheetGrabberVisible: true,
    headerLeft: () => null
  }

  return {
    modalScreensOptions,
    formSheetScreensOptions,
    modalStackNavigatorScreenOptions,
    // topMarginOffset,
    modalFirstScreenOptions,
    stackModalScreensOptions
  }
}

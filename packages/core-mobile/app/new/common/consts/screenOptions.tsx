import { View } from '@avalabs/k2-alpine'
import { NativeStackNavigationOptions } from '@react-navigation/native-stack'
import { AccountSettingBarButton } from 'common/components/AccountSettingBarButton'
import BackBarButton from 'common/components/BackBarButton'
import { ConnectButton } from 'common/components/ConnectButton'
import { ConnectedNotificationBarButton } from 'common/components/ConnectedNotificationBarButton'
import { isIOS26AndAbove } from 'common/utils/isIOS26AndAbove'
import React from 'react'
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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
  headerTitleAlign: 'center',
  animation: 'slide_from_right'
}

export const stackScreensOptions: NativeStackNavigationOptions | undefined = {
  ...stackNavigatorScreenOptions,
  headerLeft: () => <BackBarButton />
}

// Modals
export const modalScreensOptions: NativeStackNavigationOptions = {
  ...commonNavigatorScreenOptions,
  presentation:
    Platform.OS === 'ios' && !isIOS26AndAbove ? 'pageSheet' : 'formSheet',
  sheetElevation: 0,
  sheetInitialDetentIndex: 0,
  sheetAllowedDetents: [
    Platform.OS === 'android' ? 0.93 : isIOS26AndAbove ? 0.98 : 0.99
  ],
  headerLeft: () => <BackBarButton />,
  gestureEnabled: true,
  headerTransparent: true
}

export function useModalScreensOptions(): {
  modalScreensOptions: NativeStackNavigationOptions
  secondaryModalScreensOptions: NativeStackNavigationOptions
} {
  const insets = useSafeAreaInsets()
  // DEBUG_CONTENT_BG_PROBE: ORANGE = the native modal content container bg.
  // If the dark "second background" seam over the header turns orange, the
  // content view DOES cover it and the fix is contentStyle.backgroundColor =
  // $surfacePrimary on Android. If it stays dark, the seam is the scrim outside
  // the content view. Remove after.
  const debugContentBg =
    Platform.OS === 'android' ? 'rgba(255,140,0,0.7)' : undefined
  return {
    modalScreensOptions: {
      ...modalScreensOptions,
      freezeOnBlur: true,
      contentStyle: {
        // Android formsheet in native-stack has a default top padding of insets.top
        // by removing the insets.top this we adjust the navigation bar position
        marginTop: Platform.OS === 'android' ? -insets.top + 8 : undefined,
        height: '100%',
        backgroundColor: debugContentBg
      }
    },
    secondaryModalScreensOptions: {
      ...secondaryModalScreensOptions,
      freezeOnBlur: true,
      contentStyle: {
        // Android formsheet in native-stack has a default top padding of insets.top
        // by removing the insets.top this we adjust the navigation bar position
        marginTop: Platform.OS === 'android' ? -insets.top + 8 : undefined,
        height: '100%',
        backgroundColor: debugContentBg
      }
    }
  }
}

export const secondaryModalScreensOptions: NativeStackNavigationOptions = {
  ...modalScreensOptions,
  sheetAllowedDetents: [
    Platform.OS === 'android' ? 0.92 : isIOS26AndAbove ? 0.97 : 0.99
  ]
}

export const modalStackNavigatorScreenOptions: NativeStackNavigationOptions = {
  ...modalScreensOptions,
  presentation: 'card'
}

// Options for the first screen of a modal stack navigator.
// This screen does not have a back button, so we need to hide it.
export const modalFirstScreenOptions: NativeStackNavigationOptions = {
  ...commonNavigatorScreenOptions,
  headerBackVisible: false,
  headerLeft: () => null
}

export const homeScreenOptions: NativeStackNavigationOptions = {
  headerLeft: () => <AccountSettingBarButton />,
  headerRight: () => {
    return (
      <View
        sx={{
          flexDirection: 'row',
          height: '100%',
          alignItems: 'center'
        }}>
        <ConnectButton />
        <ConnectedNotificationBarButton />
      </View>
    )
  }
}

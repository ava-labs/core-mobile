import { View } from '@avalabs/k2-alpine'
import { NativeStackNavigationOptions } from '@react-navigation/native-stack'
import { AccountSettingBarButton } from 'common/components/AccountSettingBarButton'
import BackBarButton from 'common/components/BackBarButton'
import { ConnectButton } from 'common/components/ConnectButton'
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
  presentation: Platform.OS === 'ios' ? 'pageSheet' : 'formSheet',
  sheetElevation: 0,
  sheetInitialDetentIndex: 0,
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

export function useModalScreensOptions(): {
  modalScreensOptions: NativeStackNavigationOptions
  secondaryModalScreensOptions: NativeStackNavigationOptions
} {
  const insets = useSafeAreaInsets()
  return {
    modalScreensOptions: {
      ...modalScreensOptions,
      contentStyle: {
        // Android formsheet in native-stack has a default top padding of insets.top
        // by removing the insets.top this we adjust the navigation bar position
        marginTop: Platform.OS === 'android' ? -insets.top + 8 : 0
      }
    },
    secondaryModalScreensOptions: {
      ...modalScreensOptions,
      contentStyle: {
        // Android formsheet in native-stack has a default top padding of insets.top
        // by removing the insets.top this we adjust the navigation bar position
        marginTop: Platform.OS === 'android' ? -insets.top + 8 : 0
      },
      sheetAllowedDetents: [Platform.OS === 'android' ? 0.92 : 0.99]
    }
  }
}

export const secondaryModalScreensOptions: NativeStackNavigationOptions = {
  ...modalScreensOptions,
  sheetAllowedDetents: [Platform.OS === 'android' ? 0.92 : 0.99]
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
          gap: 12,
          height: '100%',
          alignItems: 'center'
        }}>
        <ConnectButton />
        {/* <Link href="/notifications/" asChild>
            <NotificationBarButton />
          </Link> */}
      </View>
    )
  }
}

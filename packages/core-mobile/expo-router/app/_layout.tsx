import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import 'react-native-reanimated'

import React from 'react'
import { K2AlpineThemeProvider } from '@avalabs/k2-alpine'
import { Stack } from '../layouts/Stack'

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

export default function RootLayout(): JSX.Element | null {
  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  return (
    <K2AlpineThemeProvider>
      <Stack screenOptions={{ headerShown: false, animationEnabled: false }}>
        <Stack.Screen name="(signedIn)" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </K2AlpineThemeProvider>
  )
}

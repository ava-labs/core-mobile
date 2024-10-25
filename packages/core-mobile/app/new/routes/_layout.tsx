import { useEffect, useMemo } from 'react'
import 'react-native-reanimated'
import Bootsplash from 'react-native-bootsplash'

import React from 'react'
import {
  K2AlpineThemeProvider,
  lightTheme,
  darkTheme
} from '@avalabs/k2-alpine'
import { Stack } from 'new/components/navigation/Stack'
import { ThemeProvider } from '@react-navigation/native'
import { useColorScheme } from 'react-native'

export default function RootLayout(): JSX.Element | null {
  useEffect(() => {
    Bootsplash.hide()
  }, [])

  const colorScheme = useColorScheme()
  const navContainerTheme = useMemo(() => {
    const isDark = colorScheme === 'dark'
    const themeColors = isDark ? darkTheme.colors : lightTheme.colors

    return {
      dark: isDark,
      colors: {
        primary: themeColors.$textPrimary,
        background: themeColors.$surfacePrimary,
        card: themeColors.$surfaceSecondary,
        text: themeColors.$textPrimary,
        border: themeColors.$borderPrimary,
        notification: themeColors.$textSuccess
      }
    }
  }, [colorScheme])

  return (
    <K2AlpineThemeProvider colorScheme={colorScheme}>
      <ThemeProvider value={navContainerTheme}>
        <Stack screenOptions={{ headerShown: false, animationEnabled: false }}>
          <Stack.Screen name="(signedIn)" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </ThemeProvider>
    </K2AlpineThemeProvider>
  )
}

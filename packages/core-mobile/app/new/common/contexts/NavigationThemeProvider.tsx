import { useTheme } from '@avalabs/k2-alpine'
import { ThemeProvider } from '@react-navigation/native'
import React, { useEffect, useMemo } from 'react'
import { Platform, useColorScheme } from 'react-native'
import { setBackgroundColorAsync } from 'expo-navigation-bar'

const NavigationThemeProvider = ({
  children
}: {
  children: React.ReactNode
}): JSX.Element => {
  const colorScheme = useColorScheme()
  const {
    theme: { colors }
  } = useTheme()

  useEffect(() => {
    if (Platform.OS === 'android')
      setBackgroundColorAsync(colors?.$surfacePrimary)
  }, [colors?.$surfacePrimary])

  const navContainerTheme = useMemo(() => {
    const isDark = colorScheme === 'dark'

    return {
      dark: isDark,
      colors: {
        primary: colors.$textPrimary,
        background: colors.$surfacePrimary,
        card: colors.$surfaceSecondary,
        text: colors.$textPrimary,
        border: colors.$borderPrimary,
        notification: colors.$textSuccess
      }
    }
  }, [colorScheme, colors])

  return <ThemeProvider value={navContainerTheme}>{children}</ThemeProvider>
}

export default NavigationThemeProvider

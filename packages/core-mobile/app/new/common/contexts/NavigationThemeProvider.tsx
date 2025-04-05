import { useTheme } from '@avalabs/k2-alpine'
import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import React, { useEffect, useMemo } from 'react'
import { Platform } from 'react-native'
import { setBackgroundColorAsync } from 'expo-navigation-bar'
import { useSelector } from 'react-redux'
import { selectSelectedColorScheme } from 'store/settings/appearance'

const NavigationThemeProvider = ({
  children
}: {
  children: React.ReactNode
}): JSX.Element => {
  const colorScheme = useSelector(selectSelectedColorScheme)
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
      },
      fonts: DefaultTheme.fonts
    }
  }, [
    colorScheme,
    colors.$borderPrimary,
    colors.$surfacePrimary,
    colors.$surfaceSecondary,
    colors.$textPrimary,
    colors.$textSuccess
  ])

  return <ThemeProvider value={navContainerTheme}>{children}</ThemeProvider>
}

export default NavigationThemeProvider

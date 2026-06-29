import { useTheme } from '@avalabs/k2-alpine'
import { DefaultTheme, ThemeProvider } from 'expo-router'
import React, { useMemo } from 'react'
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

  // A single expo-router `ThemeProvider` also themes the native bottom tabs:
  // `metro.config.js` aliases `@react-navigation/native` to expo-router's
  // vendored copy, so `@bottom-tabs/react-navigation` reads this same theme
  // context (no separate provider needed).
  return <ThemeProvider value={navContainerTheme}>{children}</ThemeProvider>
}

export default NavigationThemeProvider

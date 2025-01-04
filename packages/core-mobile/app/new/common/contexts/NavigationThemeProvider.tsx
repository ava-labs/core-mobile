import { useTheme } from '@avalabs/k2-alpine'
import { ThemeProvider } from '@react-navigation/native'
import React, { useMemo } from 'react'
import { useColorScheme } from 'react-native'

const NavigationThemeProvider = ({
  children
}: {
  children: React.ReactNode
}): JSX.Element => {
  const colorScheme = useColorScheme()
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
      }
    }
  }, [colorScheme, colors])

  return <ThemeProvider value={navContainerTheme}>{children}</ThemeProvider>
}

export default NavigationThemeProvider

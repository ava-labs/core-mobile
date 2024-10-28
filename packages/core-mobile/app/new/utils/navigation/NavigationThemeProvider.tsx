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
        // todo: please remove the ts-expect-error comments after we address this issue
        // https://ava-labs.atlassian.net/browse/CP-9297
        // @ts-expect-error
        primary: colors.$textPrimary,
        // @ts-expect-error
        background: colors.$surfacePrimary,
        // @ts-expect-error
        card: colors.$surfaceSecondary,
        // @ts-expect-error
        text: colors.$textPrimary,
        // @ts-expect-error
        border: colors.$borderPrimary,
        // @ts-expect-error
        notification: colors.$textSuccess
      }
    }
  }, [colorScheme, colors])

  return <ThemeProvider value={navContainerTheme}>{children}</ThemeProvider>
}

export default NavigationThemeProvider

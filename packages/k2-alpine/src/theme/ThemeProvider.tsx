import React, { PropsWithChildren, type FC } from 'react'
import { DripsyProvider } from 'dripsy'
import { ColorSchemeName } from 'react-native'
import {
  K2AlpineThemeVariant,
  darkTheme,
  lightTheme,
  motoDarkTheme,
  motoLightTheme
} from './theme'

export const K2AlpineThemeProvider: FC<
  PropsWithChildren & {
    colorScheme: ColorSchemeName
    variant?: K2AlpineThemeVariant
  }
> = ({ colorScheme, variant = 'default', children }) => {
  const isDark = colorScheme === 'dark'
  const theme =
    variant === 'moto'
      ? isDark
        ? motoDarkTheme
        : motoLightTheme
      : isDark
      ? darkTheme
      : lightTheme

  return <DripsyProvider theme={theme}>{children}</DripsyProvider>
}

import React, { PropsWithChildren, type FC } from 'react'
import { DripsyProvider } from 'dripsy'
import { ColorSchemeName } from 'react-native'
import { darkTheme, lightTheme } from './theme'

export const K2AlpineThemeProvider: FC<
  PropsWithChildren & { colorScheme: ColorSchemeName }
> = ({ colorScheme, children }) => {
  return (
    <DripsyProvider theme={colorScheme === 'dark' ? darkTheme : lightTheme}>
      {children}
    </DripsyProvider>
  )
}

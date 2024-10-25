// @ts-nocheck - we need to ignore this for now until https://ava-labs.atlassian.net/browse/CP-9297 is done
import React, { PropsWithChildren, type FC } from 'react'
import { DripsyProvider } from 'dripsy'
import { ColorSchemeName, useColorScheme } from 'react-native'
import { darkTheme, lightTheme } from './theme'

export const K2AlpineThemeProvider: FC<
  PropsWithChildren & { colorScheme?: ColorSchemeName }
> = ({ colorScheme, children }) => {
  const systemColorScheme = useColorScheme()
  const resultColorScheme = colorScheme ?? systemColorScheme

  return (
    <DripsyProvider
      theme={resultColorScheme === 'dark' ? darkTheme : lightTheme}>
      {children}
    </DripsyProvider>
  )
}

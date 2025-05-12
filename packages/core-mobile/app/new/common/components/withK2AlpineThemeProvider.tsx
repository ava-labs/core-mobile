import React from 'react'
import { useColorScheme } from 'react-native'
import { K2AlpineThemeProvider } from '@avalabs/k2-alpine'

export const withK2AlpineThemeProvider =
  (Component: React.ComponentType) => () => {
    const colorScheme = useColorScheme()

    return (
      <K2AlpineThemeProvider colorScheme={colorScheme}>
        <Component />
      </K2AlpineThemeProvider>
    )
  }

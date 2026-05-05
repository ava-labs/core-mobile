import React from 'react'
import { useColorScheme } from 'react-native'
import { K2AlpineThemeProvider } from '@avalabs/k2-alpine'
import { isLimitedMode } from 'utils/limitedMode'

export const withK2AlpineThemeProvider =
  (Component: React.ComponentType) => () => {
    const colorScheme = useColorScheme()

    return (
      <K2AlpineThemeProvider
        colorScheme={colorScheme}
        variant={isLimitedMode ? 'moto' : 'default'}>
        <Component />
      </K2AlpineThemeProvider>
    )
  }

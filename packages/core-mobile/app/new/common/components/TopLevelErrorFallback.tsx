import React from 'react'
import RNRestart from 'react-native-restart'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { K2AlpineThemeProvider } from '@avalabs/k2-alpine'
import { useColorScheme } from 'react-native'
import { FullScreenWarning } from './FullScreenWarning'

const TopLevelErrorFallback = (errorData: {
  error: unknown
  componentStack: string
  eventId: string
  resetError(): void
}): JSX.Element => {
  const colorScheme = useColorScheme()

  return (
    <K2AlpineThemeProvider colorScheme={colorScheme}>
      <SafeAreaProvider>
        <FullScreenWarning
          title={`Oops!\nSomething went wrong`}
          description="Please reload the application"
          action={{
            label: 'Reload',
            onPress: () => RNRestart.Restart()
          }}
          error={errorData.error}
        />
      </SafeAreaProvider>
    </K2AlpineThemeProvider>
  )
}

export default TopLevelErrorFallback

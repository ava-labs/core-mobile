import { K2AlpineThemeProvider } from '@avalabs/k2-alpine'
import React from 'react'
import { useColorScheme } from 'react-native'
import RNRestart from 'react-native-restart'
import { GenericWarning } from './GenericWarning'

const withK2AlpineThemeProvider = (Component: React.ComponentType) => () => {
  const colorScheme = useColorScheme()

  return (
    <K2AlpineThemeProvider colorScheme={colorScheme}>
      <Component />
    </K2AlpineThemeProvider>
  )
}

const TopLevelErrorFallback = (): JSX.Element => {
  return (
    <GenericWarning
      title={
        <>
          Oops!
          {'\n'}
          Something went wrong
        </>
      }
      description="Please reload the application"
      action={{
        label: 'Reload',
        onPress: () => RNRestart.Restart()
      }}
    />
  )
}

export default withK2AlpineThemeProvider(TopLevelErrorFallback)

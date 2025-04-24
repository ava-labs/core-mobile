import React from 'react'
import RNRestart from 'react-native-restart'
import { withK2AlpineThemeProvider } from './withK2AlpineThemeProvider'
import { GenericWarning } from './GenericWarning'

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

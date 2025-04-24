import React from 'react'
import RNRestart from 'react-native-restart'
import { withK2AlpineThemeProvider } from './withK2AlpineThemeProvider'
import { FullScreenWarning } from './FullScreenWarning'

const TopLevelErrorFallback = (): JSX.Element => {
  return (
    <FullScreenWarning
      title={`Oops!\nSomething went wrong`}
      description="Please reload the application"
      action={{
        label: 'Reload',
        onPress: () => RNRestart.Restart()
      }}
    />
  )
}

export default withK2AlpineThemeProvider(TopLevelErrorFallback)

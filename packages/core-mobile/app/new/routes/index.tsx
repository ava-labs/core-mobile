import { useTheme } from '@avalabs/k2-alpine'
import React from 'react'
import { View } from 'react-native'

// Added a blank screen at the top level to address a flicker issue during walletState-based navigation.
// The flicker (brief on Android, hardly noticeable on iOS) couldn't be eliminated entirely,
// so the blank screen serves as a workaround.
function IndexScreen(): JSX.Element {
  const { theme } = useTheme()

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.$surfacePrimary,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute'
      }}
    />
  )
}

export default IndexScreen

import CoreLogo from 'assets/icons/core.svg'
import { useApplicationContext } from 'contexts/ApplicationContext'
import React from 'react'
import { View } from 'react-native'

export function PrivacyScreen(): React.JSX.Element {
  const { theme } = useApplicationContext()
  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colorBg1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute'
      }}>
      <CoreLogo />
    </View>
  )
}

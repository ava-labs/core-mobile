import OwlSVG from 'components/svg/OwlSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import React from 'react'
import { View } from 'react-native'

export function PrivacyScreen() {
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
      <OwlSVG />
    </View>
  )
}

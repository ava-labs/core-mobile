import { Logos, useTheme } from '@avalabs/k2-alpine'
import React from 'react'
import { View } from 'react-native'

export function PrivacyScreen(): JSX.Element {
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
      }}>
      <Logos.Core color={theme.colors.$textPrimary} />
    </View>
  )
}

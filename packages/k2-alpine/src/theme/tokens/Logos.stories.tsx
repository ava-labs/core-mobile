import React from 'react'
import { ScrollView, useTheme, View } from '../..'
import { Logos } from './Logos'

export default {
  title: 'Logos'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}>
      <ScrollView
        style={{ width: '100%', backgroundColor: 'transparent' }}
        contentContainerStyle={{ padding: 16 }}>
        <Logos.Core color={theme.colors.$textPrimary} />
      </ScrollView>
    </View>
  )
}

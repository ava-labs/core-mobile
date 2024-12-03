import React from 'react'
import { ScrollView, View } from '../Primitives'
import { useTheme } from '../..'
import { Snackbar } from './Snackbar'

export default {
  title: 'Snackbar'
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
        contentContainerStyle={{ padding: 16, gap: 16, alignItems: 'center' }}>
        <Snackbar message="Code copied" />
      </ScrollView>
    </View>
  )
}

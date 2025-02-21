import React from 'react'
import { useTheme } from '../../hooks'
import { ScrollView, Text, View } from '../Primitives'
import { Tooltip } from './Tooltip'

export default {
  title: 'Tooltip'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()

  const title = 'Title'
  const description = 'Description'

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}>
      <ScrollView
        style={{ width: '100%', backgroundColor: 'transparent' }}
        contentContainerStyle={{
          padding: 16,
          gap: 16,
          alignItems: 'center'
        }}>
        <Text variant="heading6">Tooltip</Text>
        <Tooltip title={title} description={description} />
      </ScrollView>
    </View>
  )
}

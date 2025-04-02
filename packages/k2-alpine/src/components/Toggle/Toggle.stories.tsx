import React, { useState } from 'react'
import { ScrollView, Text, View } from '../Primitives'
import { useTheme } from '../../hooks'
import { Toggle } from './Toggle'

export default {
  title: 'Toggle'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()
  const [smallToggleValue, setSmallToggleValue] = useState(false)
  const [largeToggleValue, setLargeToggleValue] = useState(true)

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
        <Text variant="heading6">
          Toggle Small + {smallToggleValue ? 'On' : 'Off'}
        </Text>
        <Toggle value={smallToggleValue} onValueChange={setSmallToggleValue} />
        <Text variant="heading6">
          Toggle Large + {largeToggleValue ? 'On' : 'Off'}
        </Text>
        <Toggle value={largeToggleValue} onValueChange={setLargeToggleValue} />
        <Text variant="heading6">Toggle On Disabled</Text>
        <Toggle value={true} disabled />
        <Text variant="heading6">Toggle Off Disabled</Text>
        <Toggle value={false} disabled />
      </ScrollView>
    </View>
  )
}

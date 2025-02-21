import React from 'react'
import { useTheme } from '../../hooks'
import { ScrollView, Text, View } from '../Primitives'
import { Tooltip } from './Tooltip'
import { AlertButton } from 'react-native'

export default {
  title: 'Tooltip'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()

  const title = 'Title'
  const description = 'Description'

  const oneButton: AlertButton[] = [
    {
      text: 'OK',
      onPress: () => console.log('OK Pressed')
    }
  ]

  const twoButtons: AlertButton[] = [
    {
      text: 'Cancel',
      style: 'cancel',
      onPress: () => console.log('Cancel Pressed')
    },
    {
      text: 'OK',
      onPress: () => console.log('OK Pressed')
    }
  ]

  const threeButtons: AlertButton[] = [
    {
      text: 'Cancel',
      style: 'cancel',
      onPress: () => console.log('Cancel Pressed')
    },
    {
      text: 'Ask me later',
      onPress: () => console.log('OK Pressed')
    },
    {
      text: 'OK',
      onPress: () => console.log('OK Pressed')
    }
  ]

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
        <Text variant="heading6">No Button</Text>
        <Tooltip title={title} description={description} />
        <Text variant="heading6">One Button</Text>
        <Tooltip title={title} description={description} buttons={oneButton} />
        <Text variant="heading6">Two Buttons</Text>
        <Tooltip title={title} description={description} buttons={twoButtons} />
        <Text variant="heading6">Three Buttons</Text>
        <Tooltip
          title={title}
          description={description}
          buttons={threeButtons}
        />
      </ScrollView>
    </View>
  )
}

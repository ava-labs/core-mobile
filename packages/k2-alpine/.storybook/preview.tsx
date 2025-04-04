import type { Preview } from '@storybook/react'
import React from 'react'
import { withBackgrounds } from '@storybook/addon-ondevice-backgrounds'
import { View } from 'react-native'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      }
    },
    backgrounds: {
      default: 'night',
      values: [
        { name: 'night', value: '#1E1E24' },
        { name: 'day', value: 'white' }
      ]
    }
  },
  decorators: [
    Story => (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1
        }}>
        <Story />
      </View>
    ),
    Story => (
      <Story />
    ),
    withBackgrounds
  ]
}

export default preview

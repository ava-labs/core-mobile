import type { Preview } from '@storybook/react'
import React from 'react'
import { K2AlpineThemeProvider } from '../src/theme/ThemeProvider'
import { View } from 'react-native'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      }
    }
  },
  decorators: [
    Story => (
      <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <Story />
      </View>
    ),
    Story => (
      <K2AlpineThemeProvider>
        <Story />
      </K2AlpineThemeProvider>
    )
  ]
}

export default preview

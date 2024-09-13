import type { Preview } from '@storybook/react'
import React from 'react'
import { K2AlpineThemeProvider } from '../src/theme/ThemeProvider'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

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
      <GestureHandlerRootView
        style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <K2AlpineThemeProvider>
          <Story />
        </K2AlpineThemeProvider>
      </GestureHandlerRootView>
    )
  ]
}

export default preview

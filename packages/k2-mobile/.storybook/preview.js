import React from 'react'
import { withBackgrounds } from '@storybook/addon-ondevice-backgrounds'
import { K2ThemeProvider } from '../src'

export const parameters = {
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/
    }
  },
  backgrounds: {
    default: 'night',
    values: [
      { name: 'night', value: 'black' },
      { name: 'day', value: 'white' }
    ]
  }
}

const withProviders = Story => (
  <K2ThemeProvider>
    <Story />
  </K2ThemeProvider>
)

export const decorators = [withBackgrounds, withProviders]

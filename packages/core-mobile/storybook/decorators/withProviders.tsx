import React from 'react'
import { Story as SBStory } from '@storybook/react-native'
import { ReactQueryProvider } from 'contexts/ReactQueryProvider'
import { K2ThemeProvider } from '@avalabs/k2-mobile'

export const withProviders = (Story: SBStory): JSX.Element => (
  <ReactQueryProvider>
    <K2ThemeProvider>
      <Story />
    </K2ThemeProvider>
  </ReactQueryProvider>
)

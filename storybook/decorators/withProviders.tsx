import React from 'react'
import { Story as SBStory } from '@storybook/react-native'
import { ReactQueryProvider } from 'contexts/ReactQueryProvider'

export const withProviders = (Story: SBStory) => (
  <ReactQueryProvider>
    <Story />
  </ReactQueryProvider>
)

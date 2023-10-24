import React from 'react'
import { Story as SBStory } from '@storybook/react-native'
import Card from 'components/Card'

export const withCard = (Story: SBStory) => (
  <Card style={{ padding: 16, width: '100%' }}>
    <Story />
  </Card>
)

import React from 'react'
import type { Meta } from '@storybook/react-native'
import IntroScreen from 'screens/browser/IntroScreen'
import { withProviders } from '../decorators/withProviders'

export default {
  title: 'Browser/IntroScreen',
  decorators: [withProviders]
} as Meta

export const Basic = (): JSX.Element => {
  return <IntroScreen />
}

import React from 'react'
import type { Meta } from '@storybook/react-native'
import IntroScreen from 'screens/browser/IntroScreen'

export default {
  title: 'Browser/IntroScreen'
} as Meta

export const Basic = (): JSX.Element => {
  return <IntroScreen />
}

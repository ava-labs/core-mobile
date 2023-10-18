import React from 'react'
import type { Meta } from '@storybook/react-native'
import IntroScreen from 'screens/browser/IntroScreenStub'

export default {
  title: 'Browser/IntroScreenStub'
} as Meta

export const Basic = (): JSX.Element => {
  return <IntroScreen />
}

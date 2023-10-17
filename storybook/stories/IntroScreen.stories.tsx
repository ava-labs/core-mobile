import React from 'react'
import type { Meta } from '@storybook/react-native'
import IntroScreenStub from 'screens/browser/IntroScreenStub'

export default {
  title: 'Browser/IntroScreenStub'
} as Meta

export const Basic = (): JSX.Element => {
  const [shouldShowInstruction] = React.useState(true)
  return (
    <IntroScreenStub
      onInstructionRead={() => {
        null
      }}
      shouldShowInstruction={shouldShowInstruction}
    />
  )
}

import React from 'react'
import type { Meta } from '@storybook/react-native'
import { withCenterView } from '../../../storybook/decorators/withCenterView'
import { ExampleButton } from './ExampleButton'

export default {
  title: 'ExampleButton',
  decorators: [withCenterView]
} as Meta

export const Default = (): JSX.Element => {
  return <ExampleButton />
}

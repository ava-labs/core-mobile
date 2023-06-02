import React from 'react'
import type { ComponentStory, Meta } from '@storybook/react-native'
import SpinnerAnimation from 'components/animation/Spinner'
import CheckmarkAnimation from 'components/animation/Checkmark'
import { withCenterView } from '../decorators/withCenterView'

export default {
  title: 'Lottie Animations',
  decorators: [withCenterView]
} as Meta

export const Spinner: ComponentStory<typeof SpinnerAnimation> = ({ size }) => (
  <SpinnerAnimation size={size} />
)

Spinner.args = {
  size: 150
}

export const Checkmark: ComponentStory<typeof CheckmarkAnimation> = ({
  size
}) => <CheckmarkAnimation size={size} />

Checkmark.args = {
  size: 250
}

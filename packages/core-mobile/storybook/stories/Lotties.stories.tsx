import React from 'react'
import SpinnerAnimation from 'components/animation/Spinner'
import CheckmarkAnimation from 'components/animation/Checkmark'
import { withCenterView } from '../decorators/withCenterView'

export default {
  title: 'Lottie Animations',
  decorators: [withCenterView]
}

export const Spinner = ({ size }: { size: number }): React.JSX.Element => (
  <SpinnerAnimation size={size} />
)

Spinner.args = {
  size: 150
}

export const Checkmark = ({ size }: { size: number }): React.JSX.Element => (
  <CheckmarkAnimation size={size} />
)

Checkmark.args = {
  size: 250
}

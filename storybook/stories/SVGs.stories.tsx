import React from 'react'
import type { Meta } from '@storybook/react-native'
import StakeLogoBigSVG from 'components/svg/StakeLogoBigSVG'
import StakeLogoSmallSVG from 'components/svg/StakeLogoSmallSVG'
import ClockSVG from 'components/svg/ClockSVG'
import { withCenterView } from '../decorators/withCenterView'

export default {
  title: 'SVGs',
  decorators: [withCenterView]
} as Meta

export const StakeLogoBig = () => <StakeLogoBigSVG />

export const StakeLogoSmall = () => <StakeLogoSmallSVG />

export const Clock = () => <ClockSVG />

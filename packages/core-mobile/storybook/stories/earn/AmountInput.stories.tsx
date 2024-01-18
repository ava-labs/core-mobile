import React from 'react'
import type { Meta } from '@storybook/react-native'
import EarnInputAmount from 'screens/earn/EarnInputAmount'
import { Avax } from 'types/Avax'
import { withCenterView } from '../../decorators/withCenterView'

export default {
  title: 'Earn/AmountInput',
  decorators: [withCenterView]
} as Meta

export const Default: () => JSX.Element = () => (
  <EarnInputAmount inputAmount={Avax.fromBase(1)} />
)

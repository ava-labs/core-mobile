import React from 'react'
import type { Meta } from '@storybook/react-native'
import EarnInputAmount from 'screens/earn/EarnInputAmount'
import { withCenterView } from '../../decorators/withCenterView'

export default {
  title: 'Earn/AmountInput',
  decorators: [withCenterView]
} as Meta

export const Default = () => <EarnInputAmount decimals={18} />

import React from 'react'

import EarnInputAmount from 'screens/earn/EarnInputAmount'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { withCenterView } from '../../decorators/withCenterView'

export default {
  title: 'Earn/AmountInput',
  decorators: [withCenterView]
}

export const Default: () => JSX.Element = () => (
  <EarnInputAmount inputAmount={new TokenUnit(1_000_000_000, 9, 'AVAX')} />
)

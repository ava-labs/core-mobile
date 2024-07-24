import React from 'react'

import EarnInputAmount from 'screens/earn/EarnInputAmount'
import { Avax } from 'types/Avax'
import { withCenterView } from '../../decorators/withCenterView'

export default {
  title: 'Earn/AmountInput',
  decorators: [withCenterView]
}

export const Default: () => JSX.Element = () => (
  <EarnInputAmount inputAmount={Avax.fromBase(1)} />
)

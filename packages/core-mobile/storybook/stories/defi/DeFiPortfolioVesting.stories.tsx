import React from 'react'

import { DEFI_VESTING_ITEMS } from 'tests/fixtures/defi/defiVestingItems'
import { withCenterView } from '../../decorators/withCenterView'
import { DeFiPortfolioVesting as Component } from '../../../app/screens/defi/components/DeFiPortfolioVesting'
import { withCard } from '../../decorators/withCard'

export default {
  title: 'DeFi/DeFiPortfolioVesting',
  decorators: [withCard, withCenterView]
}

export const Default = () => {
  return <Component items={DEFI_VESTING_ITEMS} />
}

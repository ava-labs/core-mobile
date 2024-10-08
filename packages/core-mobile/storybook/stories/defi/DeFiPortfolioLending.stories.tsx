import React from 'react'

import { DeFiPortfolioLending as Component } from 'screens/defi/components/DeFiPortfolioLending'
import { DEFI_LENDING_ITEMS } from 'tests/fixtures/defi/defiLendingItems'
import { withCenterView } from '../../decorators/withCenterView'
import { withCard } from '../../decorators/withCard'

export default {
  title: 'DeFi/DeFiPortfolioLending',
  decorators: [withCard, withCenterView]
}

export const Default = () => {
  return <Component items={DEFI_LENDING_ITEMS} />
}

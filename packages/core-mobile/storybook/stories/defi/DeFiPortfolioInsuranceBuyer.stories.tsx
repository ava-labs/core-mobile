import React from 'react'

import { DeFiPortfolioInsuranceBuyer as Component } from 'screens/defi/components/DeFiPortfolioInsuranceBuyer'
import { DEFI_INSURANCE_BUYER_ITEMS } from 'tests/fixtures/defi/defiInsuranceBuyerItems'
import { withCenterView } from '../../decorators/withCenterView'
import { withProviders } from '../../decorators/withProviders'
import { withCard } from '../../decorators/withCard'

export default {
  title: 'DeFi/DeFiPortfolioInsuranceBuyer',
  decorators: [withCard, withCenterView, withProviders]
}

export const Default = () => {
  return <Component items={DEFI_INSURANCE_BUYER_ITEMS} />
}

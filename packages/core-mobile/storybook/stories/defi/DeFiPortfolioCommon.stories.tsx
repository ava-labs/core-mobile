import React from 'react'
import { DeFiPortfolioCommon as Component } from 'screens/defi/components/DeFiPortfolioCommon'
import { DEFI_COMMON_ITEMS } from 'tests/fixtures/defi//defiCommonItems'
import { withCenterView } from '../../decorators/withCenterView'
import { withCard } from '../../decorators/withCard'

export default {
  title: 'DeFi/DeFiPortfolioCommon',
  decorators: [withCard, withCenterView]
}

export const Default = () => {
  return <Component items={DEFI_COMMON_ITEMS} header={'Farming'} />
}

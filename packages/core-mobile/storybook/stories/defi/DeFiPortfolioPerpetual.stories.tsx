import React from 'react'
import { DeFiPortfolioPerpetual } from 'screens/defi/components/DeFiPortfolioPerpetual'
import { defiPerpetualItem } from 'tests/fixtures/defi/defiPerpetualItems'
import { withCenterView } from '../../decorators/withCenterView'
import { withCard } from '../../decorators/withCard'
import { withProviders } from '../../decorators/withProviders'

export default {
  title: 'DeFi/PortfolioPerpetual',
  decorators: [withCard, withCenterView, withProviders]
}

export const Basic = (): React.JSX.Element => {
  return <DeFiPortfolioPerpetual items={defiPerpetualItem} />
}

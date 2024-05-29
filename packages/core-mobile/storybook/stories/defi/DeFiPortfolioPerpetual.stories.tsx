import React from 'react'
import { DeFiPortfolioPerpetual } from 'screens/defi/components/DeFiPortfolioPerpetual'
import { defiPerpetualItem } from 'tests/fixtures/defi/defiPerpetualItems'
import { withCenterView } from '../../decorators/withCenterView'
import { withCard } from '../../decorators/withCard'

export default {
  title: 'DeFi/PortfolioPerpetual',
  decorators: [withCard, withCenterView]
}

export const Basic = (): React.JSX.Element => {
  return <DeFiPortfolioPerpetual items={defiPerpetualItem} />
}

import React from 'react'
import { DeFiPortfolioReward } from 'screens/defi/components/DeFiPortfolioReward'
import { defiRewardItems } from 'tests/fixtures/defi/defiRewardItems'
import { withCenterView } from '../../decorators/withCenterView'
import { withCard } from '../../decorators/withCard'
import { withProviders } from '../../decorators/withProviders'

export default {
  title: 'DeFi/PortfolioReward',
  decorators: [withCard, withCenterView, withProviders]
}

export const Basic = (): React.JSX.Element => {
  return <DeFiPortfolioReward items={defiRewardItems} />
}

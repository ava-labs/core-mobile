import React from 'react'
import type { ComponentStory, Meta } from '@storybook/react-native'
import { DeFiPortfolioReward } from 'screens/defi/components/DeFiPortfolioReward'
import { defiRewardItems } from 'tests/fixtures/defi/defiRewardItems'
import Card from 'components/Card'
import { withCenterView } from '../../decorators/withCenterView'
import { withCard } from '../../decorators/withCard'
import { withProviders } from '../../decorators/withProviders'

export default {
  title: 'DeFi/PortfolioReward',
  decorators: [withCard, withCenterView, withProviders]
} as Meta

export const Basic: ComponentStory<typeof DeFiPortfolioReward> = () => {
  return (
    <Card style={{ width: '100%', paddingHorizontal: 16 }}>
      <DeFiPortfolioReward items={defiRewardItems} />
    </Card>
  )
}

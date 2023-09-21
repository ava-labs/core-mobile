import React from 'react'
import type { ComponentStory, Meta } from '@storybook/react-native'
import { DeFiPortfolioPerpetual } from 'screens/defi/components/DeFiPortfolioPerpetual'
import { defiPerpetualItem } from 'tests/fixtures/defi/defiPerpetualItems'
import { withCenterView } from '../../decorators/withCenterView'
import { withCard } from '../../decorators/withCard'
import { withProviders } from '../../decorators/withProviders'

export default {
  title: 'DeFi/PortfolioPerpetual',
  decorators: [withCard, withCenterView, withProviders]
} as Meta

export const Basic: ComponentStory<typeof DeFiPortfolioPerpetual> = () => {
  return <DeFiPortfolioPerpetual items={defiPerpetualItem} />
}

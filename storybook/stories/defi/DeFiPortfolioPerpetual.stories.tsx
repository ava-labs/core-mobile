import React from 'react'
import type { ComponentStory, Meta } from '@storybook/react-native'
import { DeFiPortfolioPerpetual } from 'screens/defi/components/DeFiPortfolioPerpetual'
import { perpData } from 'tests/fixtures/defi/perpetualData'
import Card from 'components/Card'
import { withCenterView } from '../../decorators/withCenterView'
import { withCard } from '../../decorators/withCard'

export default {
  title: 'DeFi/PortfolioPerpetual',
  decorators: [withCard, withCenterView]
} as Meta

export const Basic: ComponentStory<typeof DeFiPortfolioPerpetual> = () => {
  return (
    <Card style={{ width: '100%', paddingHorizontal: 16 }}>
      <DeFiPortfolioPerpetual items={perpData} />
    </Card>
  )
}

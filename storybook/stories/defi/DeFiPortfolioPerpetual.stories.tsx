import React from 'react'
import type { ComponentStory, Meta } from '@storybook/react-native'
import { DeFiPortfolioPerpetual } from 'screens/defi/components/DeFiPortfolioPerpetual'
import { perpData } from 'tests/fixtures/defi/perpetualData'
import Card from 'components/Card'
import { withCenterView } from '../../decorators/withCenterView'

export default {
  title: 'DeFi/PortfolioPerpetual',
  decorators: [withCenterView]
} as Meta

export const Basic: ComponentStory<typeof DeFiPortfolioPerpetual> = () => {
  return (
    <Card style={{ width: '100%', paddingHorizontal: 16 }}>
      <DeFiPortfolioPerpetual items={perpData} />
    </Card>
  )
}

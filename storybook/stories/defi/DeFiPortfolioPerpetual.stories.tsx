import React from 'react'
import type { ComponentStory, Meta } from '@storybook/react-native'
import { DeFiPortfolioPerpetual } from 'screens/defi/components/DeFiPortfolioPerpetual'
import perpetualData from 'tests/fixtures/defi/deFiPerpetualData.json'
import { DefiPerpetualItem } from 'services/defi/types'
import Card from 'components/Card'
import { withCenterView } from '../../decorators/withCenterView'

export default {
  title: 'DeFiPortfolioPerpetual',
  decorators: [withCenterView]
} as Meta

export const Basic: ComponentStory<typeof DeFiPortfolioPerpetual> = () => {
  return (
    <Card style={{ width: '100%', paddingHorizontal: 16 }}>
      <DeFiPortfolioPerpetual
        items={perpetualData as unknown as DefiPerpetualItem[]}
      />
    </Card>
  )
}

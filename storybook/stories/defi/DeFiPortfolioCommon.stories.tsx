import React from 'react'
import type { Meta } from '@storybook/react-native'
import { DeFiPortfolioCommon as Component } from 'screens/defi/components/DeFiPortfolioCommon'
import { DEFI_COMMON_ITEMS } from 'tests/fixtures/defi//defiCommonItems'
import Card from 'components/Card'
import { withCenterView } from '../../decorators/withCenterView'

export default {
  title: 'DeFi',
  decorators: [withCenterView]
} as Meta

export const DeFiPortfolioCommon = () => {
  return (
    <Card style={{ padding: 16, width: '100%' }}>
      <Component items={DEFI_COMMON_ITEMS} header={'Farming'} />
    </Card>
  )
}

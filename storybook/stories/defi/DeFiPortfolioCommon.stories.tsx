import React from 'react'
import type { Meta } from '@storybook/react-native'
import { DeFiPortfolioCommon as Component } from 'screens/defi/components/DeFiPortfolioCommon'
import { DEFI_COMMON_ITEMS } from 'tests/fixtures/defi//defiCommonItems'
import Card from 'components/Card'
import { ReactQueryProvider } from 'contexts/ReactQueryProvider'
import { withCenterView } from '../../decorators/withCenterView'

export default {
  title: 'DeFi/DeFiPortfolioCommon',
  decorators: [withCenterView]
} as Meta

export const Default = () => {
  return (
    <ReactQueryProvider>
      <Card style={{ padding: 16, width: '100%' }}>
        <Component items={DEFI_COMMON_ITEMS} header={'Farming'} />
      </Card>
    </ReactQueryProvider>
  )
}

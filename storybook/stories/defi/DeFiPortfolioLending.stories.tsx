import React from 'react'
import type { Meta } from '@storybook/react-native'
import { DeFiPortfolioLending as Component } from 'screens/defi/components/DeFiPortfolioLending'
import { DEFI_LENDING_ITEMS } from 'tests/fixtures/defi/defiLendingItems'
import Card from 'components/Card'
import { ReactQueryProvider } from 'contexts/ReactQueryProvider'
import { withCenterView } from '../../decorators/withCenterView'

export default {
  title: 'DeFi/DeFiPortfolioLending',
  decorators: [withCenterView]
} as Meta

export const Default = () => {
  return (
    <ReactQueryProvider>
      <Card style={{ padding: 16, width: '100%' }}>
        <Component items={DEFI_LENDING_ITEMS} />
      </Card>
    </ReactQueryProvider>
  )
}

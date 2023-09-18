import React from 'react'
import type { Meta } from '@storybook/react-native'
import { DEFI_VESTING_ITEMS } from 'tests/fixtures/defi/defiVestingItems'
import Card from 'components/Card'
import { withCenterView } from '../../decorators/withCenterView'
import { DeFiPortfolioVesting as Component } from '../../../app/screens/defi/components/DeFiPortfolioVesting'

export default {
  title: 'DeFi',
  decorators: [withCenterView]
} as Meta

export const DeFiPortfolioVesting = () => {
  return (
    <Card style={{ padding: 16, width: '100%' }}>
      <Component items={DEFI_VESTING_ITEMS} />
    </Card>
  )
}

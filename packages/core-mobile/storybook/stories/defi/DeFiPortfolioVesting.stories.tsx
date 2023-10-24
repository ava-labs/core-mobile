import React from 'react'
import type { Meta } from '@storybook/react-native'
import { DEFI_VESTING_ITEMS } from 'tests/fixtures/defi/defiVestingItems'
import { withCenterView } from '../../decorators/withCenterView'
import { DeFiPortfolioVesting as Component } from '../../../app/screens/defi/components/DeFiPortfolioVesting'
import { withCard } from '../../decorators/withCard'
import { withProviders } from '../../decorators/withProviders'

export default {
  title: 'DeFi/DeFiPortfolioVesting',
  decorators: [withCard, withCenterView, withProviders]
} as Meta

export const Default = () => {
  return <Component items={DEFI_VESTING_ITEMS} />
}

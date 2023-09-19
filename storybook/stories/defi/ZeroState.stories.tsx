import React from 'react'
import type { Meta } from '@storybook/react-native'
import { ZeroState } from 'screens/defi/components/ZeroState'
import { noop } from '@avalabs/utils-sdk'

export default {
  title: 'DeFi/ZeroState'
} as Meta

export const ProtocolList = () => (
  <ZeroState
    bodyText="Discover top dApps on Avalanche now."
    onExploreEcosystem={noop}
  />
)
export const ProtocolDetails = () => (
  <ZeroState
    bodyText="No data has been found. Go back to 
DeFi portfolio."
  />
)

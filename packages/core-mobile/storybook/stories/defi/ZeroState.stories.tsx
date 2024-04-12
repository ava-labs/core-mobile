import React from 'react'

import { ZeroState } from 'screens/defi/components/ZeroState'
import { noop } from '@avalabs/utils-sdk'
import { withCenterView } from '../../decorators/withCenterView'

export default {
  title: 'DeFi/ZeroState',
  decorators: [withCenterView]
}

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

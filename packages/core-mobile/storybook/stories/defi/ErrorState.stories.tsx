import React from 'react'

import { ErrorState as ListErrorState } from 'screens/defi/components/ErrorState'
import { ProtocolDetailsErrorState as DetailsErrorState } from 'screens/defi/components/ProtocolDetailsErrorState'

export default {
  title: 'DeFi/ErrorState'
}

export const ProtocolList = () => <ListErrorState />
export const ProtocolDetails = () => <DetailsErrorState />

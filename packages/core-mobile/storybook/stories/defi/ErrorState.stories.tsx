import React from 'react'
import type { Meta } from '@storybook/react-native'
import { ErrorState as ListErrorState } from 'screens/defi/components/ErrorState'
import { ProtocolDetailsErrorState as DetailsErrorState } from 'screens/defi/components/ProtocolDetailsErrorState'

export default {
  title: 'DeFi/ErrorState'
} as Meta

export const ProtocolList = () => <ListErrorState />
export const ProtocolDetails = () => <DetailsErrorState />

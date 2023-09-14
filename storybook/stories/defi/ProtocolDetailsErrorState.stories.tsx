import React from 'react'
import type { Meta } from '@storybook/react-native'
import { ProtocolDetailsErrorState as ErrorState } from 'screens/defi/components/ProtocolDetailsErrorState'

export default {
  title: 'DeFi'
} as Meta

export const ProtocolDetailsErrorState = () => <ErrorState />

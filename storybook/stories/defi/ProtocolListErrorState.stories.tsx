import React from 'react'
import type { Meta } from '@storybook/react-native'
import { ErrorState } from 'screens/defi/components/ErrorState'

export default {
  title: 'DeFi'
} as Meta

export const ProtocolListErrorState = () => <ErrorState />

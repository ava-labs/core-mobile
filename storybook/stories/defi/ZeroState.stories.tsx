import React from 'react'
import type { Meta } from '@storybook/react-native'
import { ZeroState } from 'screens/defi/components/ZeroState'

export default {
  title: 'DeFi/ZeroState'
} as Meta

export const Default = () => <ZeroState />
export const SkipBodyText = () => <ZeroState skipBodyText />

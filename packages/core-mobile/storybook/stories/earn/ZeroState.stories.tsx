import React from 'react'
import type { Meta } from '@storybook/react-native'
import * as ZeroState from 'screens/earn/components/ZeroState'

export default {
  title: 'Earn/ZeroStates'
} as Meta

export const NoActiveStakes = () => <ZeroState.NoActiveStakes />

export const NoPastStakes = () => <ZeroState.NoPastStakes />

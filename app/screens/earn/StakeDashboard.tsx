import React from 'react'
import { View } from 'react-native'
import { StakeTabs } from './StakeTabs'

export enum StakeTypeEnum {
  Available = 'Available',
  Staked = 'Staked',
  Claimable = 'Claimable'
}

export const StakeDashboard = () => {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 150 }} />
      <StakeTabs />
    </View>
  )
}

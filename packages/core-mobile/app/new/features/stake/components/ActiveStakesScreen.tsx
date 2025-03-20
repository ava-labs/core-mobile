import React from 'react'
import { useActiveStakes } from 'hooks/earn/useActiveStakes'
import { SharedValue } from 'react-native-reanimated'
import { DeviceMotionMeasurement } from 'expo-sensors'
import StakesScreen from './StakesScreen'

export const ActiveStakesScreen = ({
  onPressStake,
  onAddStake,
  motion
}: {
  onPressStake: () => void
  onAddStake: () => void
  motion?: SharedValue<DeviceMotionMeasurement | undefined>
}): JSX.Element => {
  const { stakes } = useActiveStakes()

  return (
    <StakesScreen
      stakes={stakes}
      onPressStake={onPressStake}
      onAddStake={onAddStake}
      motion={motion}
    />
  )
}

import React from 'react'
import { useStakes } from 'hooks/earn/useStakes'
import { SharedValue } from 'react-native-reanimated'
import { DeviceMotionMeasurement } from 'expo-sensors'
import StakesScreen from './StakesScreen'

export const AllStakesScreen = ({
  onPressStake,
  onAddStake,
  motion
}: {
  onPressStake: () => void
  onAddStake: () => void
  motion?: SharedValue<DeviceMotionMeasurement | undefined>
}): JSX.Element => {
  const { data } = useStakes()

  return (
    <StakesScreen
      stakes={data ?? []}
      onPressStake={onPressStake}
      onAddStake={onAddStake}
      motion={motion}
    />
  )
}

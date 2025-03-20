import React from 'react'
import { usePastStakes } from 'hooks/earn/usePastStakes'
import { SharedValue } from 'react-native-reanimated'
import { DeviceMotionMeasurement } from 'expo-sensors'
import StakesScreen from './StakesScreen'

export const CompletedStakesScreen = ({
  onPressStake,
  onAddStake,
  motion
}: {
  onPressStake: () => void
  onAddStake: () => void
  motion?: SharedValue<DeviceMotionMeasurement | undefined>
}): JSX.Element => {
  const { stakes } = usePastStakes()

  return (
    <StakesScreen
      stakes={stakes}
      onPressStake={onPressStake}
      onAddStake={onAddStake}
      motion={motion}
    />
  )
}

import { Motion } from '@avalabs/k2-alpine'
import { useStakes } from 'hooks/earn/useStakes'
import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import StakesScreen from './StakesScreen'

export const AllStakesScreen = ({
  onPressStake,
  onAddStake,
  onClaim,
  motion,
  canAddStake,
  containerStyle
}: {
  onPressStake: (txHash: string) => void
  onAddStake: () => void
  onClaim: () => void
  motion?: Motion
  canAddStake: boolean
  containerStyle?: StyleProp<ViewStyle>
}): JSX.Element => {
  const { data, isRefreshing, pullToRefresh } = useStakes()

  return (
    <StakesScreen
      stakes={data ?? []}
      onPressStake={onPressStake}
      onAddStake={onAddStake}
      onClaim={onClaim}
      onRefresh={pullToRefresh}
      isRefreshing={isRefreshing}
      motion={motion}
      canAddStake={canAddStake}
      containerStyle={containerStyle}
    />
  )
}

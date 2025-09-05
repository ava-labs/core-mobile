import { Motion } from '@avalabs/k2-alpine'
import { useActiveStakes } from 'hooks/earn/useActiveStakes'
import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import StakesScreen from './StakesScreen'

export const ActiveStakesScreen = ({
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
  const { stakes, isRefreshing, pullToRefresh } = useActiveStakes()

  return (
    <StakesScreen
      stakes={stakes}
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

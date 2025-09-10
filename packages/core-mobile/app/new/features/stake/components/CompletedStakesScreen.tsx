import { usePastStakes } from 'hooks/earn/usePastStakes'
import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import StakesScreen from './StakesScreen'

export const CompletedStakesScreen = ({
  onPressStake,
  onAddStake,
  onClaim,
  canAddStake,
  containerStyle
}: {
  onPressStake: (txHash: string) => void
  onAddStake: () => void
  onClaim: () => void
  canAddStake: boolean
  containerStyle?: StyleProp<ViewStyle>
}): JSX.Element => {
  const { stakes, isRefreshing, pullToRefresh } = usePastStakes()

  return (
    <StakesScreen
      stakes={stakes}
      onPressStake={onPressStake}
      onAddStake={onAddStake}
      onClaim={onClaim}
      onRefresh={pullToRefresh}
      isRefreshing={isRefreshing}
      canAddStake={canAddStake}
      containerStyle={containerStyle}
    />
  )
}

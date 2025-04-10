import React from 'react'
import { usePastStakes } from 'hooks/earn/usePastStakes'
import StakesScreen from './StakesScreen'

export const CompletedStakesScreen = ({
  onPressStake,
  onAddStake,
  onClaim,
  canAddStake
}: {
  onPressStake: (txHash: string) => void
  onAddStake: () => void
  onClaim: () => void
  canAddStake: boolean
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
    />
  )
}

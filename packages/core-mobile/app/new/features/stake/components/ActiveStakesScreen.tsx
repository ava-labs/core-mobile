import React from 'react'
import { Motion } from '@avalabs/k2-alpine'
import { useActiveStakes } from 'hooks/earn/useActiveStakes'
import StakesScreen from './StakesScreen'

export const ActiveStakesScreen = ({
  onPressStake,
  onAddStake,
  onClaim,
  motion,
  canAddStake
}: {
  onPressStake: (txHash: string) => void
  onAddStake: () => void
  onClaim: () => void
  motion?: Motion
  canAddStake: boolean
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
    />
  )
}

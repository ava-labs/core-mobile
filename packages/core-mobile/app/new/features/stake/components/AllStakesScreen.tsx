import React from 'react'
import { useStakes } from 'hooks/earn/useStakes'
import { Motion } from '@avalabs/k2-alpine'
import StakesScreen from './StakesScreen'

export const AllStakesScreen = ({
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
    />
  )
}

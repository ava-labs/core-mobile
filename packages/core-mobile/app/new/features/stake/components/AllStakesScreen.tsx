import React from 'react'
import { useStakes } from 'hooks/earn/useStakes'
import { Motion } from '@avalabs/k2-alpine'
import StakesScreen from './StakesScreen'

export const AllStakesScreen = ({
  onPressStake,
  onAddStake,
  onClaim,
  motion
}: {
  onPressStake: () => void
  onAddStake: () => void
  onClaim: () => void
  motion?: Motion
}): JSX.Element => {
  const { data } = useStakes()

  return (
    <StakesScreen
      stakes={data ?? []}
      onPressStake={onPressStake}
      onAddStake={onAddStake}
      onClaim={onClaim}
      motion={motion}
    />
  )
}

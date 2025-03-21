import React from 'react'
import { usePastStakes } from 'hooks/earn/usePastStakes'
import { Motion } from '@avalabs/k2-alpine'
import StakesScreen from './StakesScreen'

export const CompletedStakesScreen = ({
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
  const { stakes } = usePastStakes()

  return (
    <StakesScreen
      stakes={stakes}
      onPressStake={onPressStake}
      onAddStake={onAddStake}
      onClaim={onClaim}
      motion={motion}
    />
  )
}

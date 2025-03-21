import React from 'react'
import { useActiveStakes } from 'hooks/earn/useActiveStakes'
import { Motion } from '@avalabs/k2-alpine'
import StakesScreen from './StakesScreen'

export const ActiveStakesScreen = ({
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
  const { stakes } = useActiveStakes()

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

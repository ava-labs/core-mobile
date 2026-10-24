import React from 'react'
import StakeDurationScreen from 'features/stake/v2/screens/StakeDurationScreen'

/**
 * Fast Stake "Select a duration" route. Mirror under
 * `delegate/duration.tsx` when the advanced delegate flow lands — same
 * screen component, different `nextRoute`.
 */
export default function FastStakeDurationRoute(): JSX.Element {
  return <StakeDurationScreen nextRoute="/addStakeV2/fastStake/confirm" />
}

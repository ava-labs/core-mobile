import React from 'react'
import StakeAmountScreen from 'features/stake/v2/screens/StakeAmountScreen'

/**
 * Fast Stake "How much do you want to stake?" route. Mirror under
 * `delegate/amount.tsx` when the advanced delegate flow lands — same
 * screen component, different `nextRoute`.
 */
export default function FastStakeAmountRoute(): JSX.Element {
  return <StakeAmountScreen nextRoute="/addStakeV2/fastStake/duration" />
}

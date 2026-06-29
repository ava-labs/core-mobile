import React from 'react'
import StakeDurationScreen from 'features/stake/v2/screens/StakeDurationScreen'
import { useSelectedDelegateNodeLimits } from 'features/stake/v2/hooks/useSelectedDelegateNodeLimits'

/**
 * Advanced delegate "How long do you want to stake?" route. Same shared
 * screen as Fast Stake, navigating to the delegate confirm on Next and
 * capping the custom end date at the selected node's end time.
 */
export default function DelegateDurationRoute(): JSX.Element {
  const { maxEndDate } = useSelectedDelegateNodeLimits()
  return (
    <StakeDurationScreen
      nextRoute="/addStakeV2/delegate/confirm"
      maxEndDate={maxEndDate}
    />
  )
}

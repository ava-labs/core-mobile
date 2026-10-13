import React from 'react'
import StakeDurationScreen from 'features/stake/v2/screens/StakeDurationScreen'
import { useSelectedDelegateNodeLimits } from 'features/stake/v2/hooks/useSelectedDelegateNodeLimits'
import {
  getRestakePrefill,
  useDelegateNodeSelection
} from 'features/stake/v2/store'

/**
 * Advanced delegate "How long do you want to stake?" route. Same shared
 * screen as Fast Stake, navigating to the delegate confirm on Next,
 * capping the custom end date at the selected node's end time, and baking
 * the node's actual delegation fee into the reward chart so the estimates
 * match the confirm screen's quote.
 *
 * On the delegate-restake fallback path (original validator gone → node
 * picker → amount → here), the restake prefill supplies the original
 * stake's duration so the screen opens pre-selected on it (web parity:
 * `DelegationForm`'s `initialDurationMs`).
 */
export default function DelegateDurationRoute(): JSX.Element {
  const { maxEndDate } = useSelectedDelegateNodeLimits()
  const node = useDelegateNodeSelection(state => state.nodes[state.index])
  return (
    <StakeDurationScreen
      nextRoute="/addStakeV2/delegate/confirm"
      maxEndDate={maxEndDate}
      delegationFeePercent={node ? Number(node.delegationFee) : undefined}
      initialDurationDays={getRestakePrefill()?.durationDays}
    />
  )
}

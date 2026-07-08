import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectIsDelegationFeeBlocked } from 'store/posthog'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import {
  DELEGATION_FEE_RATE,
  getDelegationFeeEscrowAddress
} from '../constants'
import { StakeReviewSource } from '../types'
import { useDelegateNodeSelection } from '../store'

// Hoisted so the memo doesn't allocate a fresh Error on every recompute when no
// node is selected.
const NO_NODE_SELECTED_ERROR = new Error('No node selected')

/**
 * Advanced delegate data source for `StakeConfirmScreen`.
 *
 * Unlike Fast Stake (which resolves a validator server-side), the advanced
 * flow uses the node the user picked on the Node details screen — held in the
 * delegate node-selection store.
 *
 * The service fee mirrors Fast Stake's convenience fee, but is gated behind
 * its own `delegation-fee-enabled` flag and paid to a delegate-specific escrow
 * address. When the flag is off, `feePolicy` is null and the confirm screen
 * skips the fee output, the caption, and the analytics field.
 */
export const useAdvancedReviewSource = (): StakeReviewSource => {
  const nodes = useDelegateNodeSelection(state => state.nodes)
  const index = useDelegateNodeSelection(state => state.index)
  const node = nodes[index]

  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isDelegationFeeBlocked = useSelector(selectIsDelegationFeeBlocked)
  const isDelegationFeeEnabled = !isDelegationFeeBlocked

  return useMemo<StakeReviewSource>(
    () => ({
      validator: node
        ? {
            nodeID: node.nodeID,
            endTime: node.endTime,
            delegationFee: node.delegationFee
          }
        : undefined,
      isFetching: false,
      error: node ? null : NO_NODE_SELECTED_ERROR,
      feePolicy: isDelegationFeeEnabled
        ? {
            rate: DELEGATION_FEE_RATE,
            recipientAddresses: [getDelegationFeeEscrowAddress(isDeveloperMode)]
          }
        : null
    }),
    [node, isDelegationFeeEnabled, isDeveloperMode]
  )
}

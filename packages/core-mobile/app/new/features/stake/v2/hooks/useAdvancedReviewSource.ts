import { useLocalSearchParams } from 'expo-router'
import { useNodes } from 'hooks/earn/useNodes'
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
 * Sentinel for "the restake target validator has left the active set".
 * Exported so the delegate confirm route can identity-match it and redirect
 * to the node picker (web parity) instead of letting the confirm screen
 * surface its generic no-match alert.
 */
export const RESTAKE_NODE_UNAVAILABLE_ERROR = new Error(
  'The original node is no longer available for delegation'
)

/**
 * Advanced delegate data source for `StakeConfirmScreen`.
 *
 * Unlike Fast Stake (which resolves a validator server-side), the advanced
 * flow uses the node the user picked on the Node details screen — held in the
 * delegate node-selection store.
 *
 * Restake is the exception: `useRestake` navigates straight to the delegate
 * confirm with a `restakeNodeId` param (the original stake's node), and this
 * hook resolves it against the current validator set — `isFetching` drives
 * the confirm screen's loading state, and a node that has left the active set
 * surfaces as an error (the screen's no-match alert), since restaking reuses
 * the original node verbatim rather than auto-selecting a substitute.
 *
 * The service fee mirrors Fast Stake's convenience fee, but is gated behind
 * its own `delegation-fee-enabled` flag and paid to a delegate-specific escrow
 * address. When the flag is off, `feePolicy` is null and the confirm screen
 * skips the fee output, the caption, and the analytics field.
 */
export const useAdvancedReviewSource = (): StakeReviewSource => {
  const nodes = useDelegateNodeSelection(state => state.nodes)
  const index = useDelegateNodeSelection(state => state.index)
  const selectedNode = nodes[index]

  // Only present on the restake path — the normal delegate flow never sets it.
  const { restakeNodeId } = useLocalSearchParams<{ restakeNodeId?: string }>()
  const isRestake = restakeNodeId !== undefined && restakeNodeId !== ''
  const {
    data: validatorsData,
    isFetching: isFetchingValidators,
    error: validatorsError
  } = useNodes(isRestake)

  const node = useMemo(() => {
    if (!isRestake) return selectedNode
    return validatorsData?.validators.find(v => v.nodeID === restakeNodeId)
  }, [isRestake, selectedNode, validatorsData, restakeNodeId])

  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isDelegationFeeBlocked = useSelector(selectIsDelegationFeeBlocked)
  const isDelegationFeeEnabled = !isDelegationFeeBlocked

  return useMemo<StakeReviewSource>(() => {
    let error: Error | null = null
    if (!node) {
      if (isRestake) {
        error = isFetchingValidators
          ? null
          : validatorsError ?? RESTAKE_NODE_UNAVAILABLE_ERROR
      } else {
        error = NO_NODE_SELECTED_ERROR
      }
    }
    return {
      validator: node
        ? {
            nodeID: node.nodeID,
            endTime: node.endTime,
            delegationFee: node.delegationFee
          }
        : undefined,
      isFetching: isRestake ? isFetchingValidators : false,
      error,
      feePolicy: isDelegationFeeEnabled
        ? {
            rate: DELEGATION_FEE_RATE,
            recipientAddresses: [getDelegationFeeEscrowAddress(isDeveloperMode)]
          }
        : null
    }
  }, [
    node,
    isRestake,
    isFetchingValidators,
    validatorsError,
    isDelegationFeeEnabled,
    isDeveloperMode
  ])
}

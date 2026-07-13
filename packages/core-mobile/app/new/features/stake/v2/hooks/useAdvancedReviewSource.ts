import { useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'
import { useNodes } from 'hooks/earn/useNodes'
import { useStakeAmount } from 'hooks/earn/useStakeAmount'
import { useNow } from 'hooks/time/useNow'
import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { getMinimumStakeDurationMs } from 'services/earn/utils'
import {
  selectDelegationFeeRate,
  selectIsDelegationFeeBlocked
} from 'store/posthog'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { getDelegationFeeEscrowAddress } from '../constants'
import { StakeReviewSource } from '../types'
import { useDelegateNodeSelection } from '../store'
import { getDelegateNodeLimits } from './useSelectedDelegateNodeLimits'

// Matches `useValidateStakingEndTime`'s min-start-time buffer (submission is
// anchored at now + 1 minute).
const MIN_START_TIME_BUFFER_MS = 60 * 1000

// Covers the wall-clock drift between this render-time check and the actual
// submission: `computeDelegateDates` re-anchors the start at submit time
// (+1 min) and, for minimum-duration stakes, extends the end date by the
// elapsed time — so a node that clears the gate by only a few seconds can
// still produce a delegation the chain rejects (past the validator's end, or
// under the minimum duration from the fresh start) after the C→P import has
// already run. Five minutes comfortably exceeds any realistic review dwell
// time; a validator that close to its end is a bad restake target anyway.
const SUBMIT_DRIFT_MARGIN_MS = 5 * 60 * 1000

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
 * Sentinel for "the restake target validator is still active but no longer
 * has enough delegation capacity for the original amount". The normal flow
 * catches this on the amount screen (`exceedsNodeCapacity`); restake skips
 * that screen, so the check happens here at node-resolution time instead —
 * without it, the user could slide-to-stake something the chain will reject.
 * Surfaced to the confirm route the same way as the unavailable sentinel.
 */
export const RESTAKE_NODE_FULL_ERROR = new Error(
  'The original node no longer has enough delegation capacity'
)
/**
 * Sentinel for "the restake target validator is still active but its own
 * validation period ends too soon to host even a minimum-duration stake".
 * The normal flow catches this on the duration screen (`exceedsNodeEndTime`);
 * restake skips that screen, and `useValidateStakingEndTime` clamps the end
 * time to the validator's *after* its min-duration adjustment — so without
 * this gate a sub-minimum stake could reach the chain (which rejects it after
 * the cross-chain import has already run). Surfaced to the confirm route the
 * same way as the other restake sentinels.
 */
export const RESTAKE_NODE_ENDING_ERROR = new Error(
  "The original node's remaining validation period is too short"
)
/**
 * Sentinel for "the validators query itself failed" (network / RPC), so the
 * confirm route can surface a connection-appropriate message instead of the
 * confirm screen's generic "no node matches your requirements" alert — which
 * describes a filtering miss, not a dropped connection.
 */
export const RESTAKE_NODES_FETCH_FAILED_ERROR = new Error(
  'Unable to load the validator list for restake'
)

/**
 * Maps the source's resolution state to the error surfaced to the confirm
 * screen / route. Module-level so the branch chain stays out of the hook's
 * cognitive-complexity budget. A failed fetch means we couldn't even check
 * the node, so it gets its own sentinel (connection-appropriate copy)
 * instead of "node unavailable" (which implies we checked).
 */
const pickSourceError = ({
  hasNode,
  isRestake,
  isFetchingValidators,
  validatorsError,
  isRestakeNodeEnding,
  isRestakeNodeFull
}: {
  hasNode: boolean
  isRestake: boolean
  isFetchingValidators: boolean
  validatorsError: Error | null
  isRestakeNodeEnding: boolean
  isRestakeNodeFull: boolean
}): Error | null => {
  if (!hasNode) {
    if (!isRestake) return NO_NODE_SELECTED_ERROR
    if (isFetchingValidators) return null
    return validatorsError
      ? RESTAKE_NODES_FETCH_FAILED_ERROR
      : RESTAKE_NODE_UNAVAILABLE_ERROR
  }
  if (isRestakeNodeEnding) return RESTAKE_NODE_ENDING_ERROR
  if (isRestakeNodeFull) return RESTAKE_NODE_FULL_ERROR
  return null
}

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

  // Restake entry always re-fetches the validator set: `useNodes` has a
  // 5-minute staleTime, so a warm cache (e.g. the user was just in the node
  // picker) would otherwise serve the eligibility gates a stale snapshot with
  // no refetch at all. Invalidating on entry keeps the gates — and the
  // confirm CTA hold on `isFetching` — anchored to current data.
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!isRestake) return
    queryClient.invalidateQueries({ queryKey: ['nodes'] })
    // Entry-time effect by design: `isRestake` is fixed for the life of the
    // route (it comes from the navigation params).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const node = useMemo(() => {
    if (!isRestake) return selectedNode
    return validatorsData?.validators.find(v => v.nodeID === restakeNodeId)
  }, [isRestake, selectedNode, validatorsData, restakeNodeId])

  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isDelegationFeeBlocked = useSelector(selectIsDelegationFeeBlocked)
  const isDelegationFeeEnabled = !isDelegationFeeBlocked
  // Flag-driven (multivariate variant in bps, 10% fallback) — see
  // `selectDelegationFeeRate`.
  const delegationFeeRate = useSelector(selectDelegationFeeRate)

  // Restake only: the node's remaining delegation capacity must still cover
  // the original amount (the seeded shared amount). The normal flow enforces
  // this on the amount screen, which restake skips. Suppressed while the
  // validators query is (re)fetching: a warm cache serves the node instantly,
  // and evaluating against that stale snapshot could fire the confirm route's
  // irreversible redirect-to-picker alert for a node fresh data would pass —
  // same settle-first treatment the not-found case gets below (the CTA is
  // already held during the fetch via `isFetching`).
  const [stakeAmount] = useStakeAmount()
  const isRestakeNodeFull = useMemo(() => {
    if (!isRestake || !node || isFetchingValidators) return false
    const { maxAmount } = getDelegateNodeLimits(node, isDeveloperMode)
    return stakeAmount.gt(maxAmount)
  }, [isRestake, node, isFetchingValidators, isDeveloperMode, stakeAmount])

  // Restake only: the node's own validation period must have room for at
  // least a minimum-duration stake (anchored at now + the same 1-minute
  // buffer `useValidateStakingEndTime` uses for the start time). The normal
  // flow enforces this on the duration screen (`exceedsNodeEndTime`), which
  // restake skips. When the remaining time covers the minimum but not the
  // original duration, the stake proceeds with the end time clamped to the
  // validator's — shown on the review — mirroring web's `DelegationForm`,
  // which clamps its prefilled duration to the node's remaining days.
  // Suppressed while fetching for the same reason as the capacity gate.
  const now = useNow()
  const isRestakeNodeEnding = useMemo(() => {
    if (!isRestake || !node || isFetchingValidators) return false
    const { maxEndDate } = getDelegateNodeLimits(node, isDeveloperMode)
    return (
      maxEndDate.getTime() - now <
      MIN_START_TIME_BUFFER_MS +
        getMinimumStakeDurationMs(isDeveloperMode) +
        SUBMIT_DRIFT_MARGIN_MS
    )
  }, [isRestake, node, isFetchingValidators, isDeveloperMode, now])

  return useMemo<StakeReviewSource>(() => {
    const isRestakeNodeUnusable = isRestakeNodeFull || isRestakeNodeEnding
    const error = pickSourceError({
      hasNode: node !== undefined,
      isRestake,
      isFetchingValidators,
      validatorsError,
      isRestakeNodeEnding,
      isRestakeNodeFull
    })
    return {
      // A capacity-exhausted / soon-ending restake node reads as "no
      // validator" so the confirm screen can't proceed with it even if the
      // redirect is slow.
      validator:
        node && !isRestakeNodeUnusable
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
            rate: delegationFeeRate,
            recipientAddresses: [getDelegationFeeEscrowAddress(isDeveloperMode)]
          }
        : null
    }
  }, [
    node,
    isRestake,
    isRestakeNodeFull,
    isRestakeNodeEnding,
    isFetchingValidators,
    validatorsError,
    isDelegationFeeEnabled,
    delegationFeeRate,
    isDeveloperMode
  ])
}

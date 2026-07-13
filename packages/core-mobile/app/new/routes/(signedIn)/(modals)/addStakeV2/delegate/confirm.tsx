import { showAlert } from '@avalabs/k2-alpine'
import { LoadingState } from 'common/components/LoadingState'
import { Href, useLocalSearchParams, useRouter } from 'expo-router'
import {
  RESTAKE_NODE_ENDING_ERROR,
  RESTAKE_NODE_FULL_ERROR,
  RESTAKE_NODE_UNAVAILABLE_ERROR,
  RESTAKE_NODES_FETCH_FAILED_ERROR,
  useAdvancedReviewSource
} from 'features/stake/v2/hooks/useAdvancedReviewSource'
import StakeConfirmScreen from 'features/stake/v2/screens/StakeConfirmScreen'
import React, { useEffect, useRef } from 'react'
import { truncateNodeId } from 'utils/Utils'

/**
 * Advanced delegate confirm route. Feeds the user-selected validator (via
 * `useAdvancedReviewSource`) into the shared `StakeConfirmScreen` with
 * `isAdvanced` for analytics. A service fee applies when the
 * `delegation-fee-enabled` flag is on (see `useAdvancedReviewSource`).
 *
 * Restake lands here directly with a `restakeNodeId` param. When that
 * validator has left the active set — or is still active but can't host the
 * stake anymore (delegation capacity below the original amount, or its own
 * validation period ending before a minimum-duration stake could) — this
 * wrapper redirects to the node picker with a notice instead of rendering the
 * confirm (which would fire its generic no-match alert) — web parity with
 * `StakingDelegatePage`'s validator-not-found search fallback. The restake
 * prefill (amount/duration) stays active, so the picker flow reopens with the
 * original stake's values. A failed validators fetch takes the same redirect
 * with connection-appropriate copy — the picker has its own error + retry
 * surface for a still-failing query.
 */
export default function DelegateConfirmRoute(): JSX.Element {
  const source = useAdvancedReviewSource()
  const { replace } = useRouter()
  const { restakeNodeId } = useLocalSearchParams<{ restakeNodeId?: string }>()
  const isRestakeNodeFull = source.error === RESTAKE_NODE_FULL_ERROR
  const isRestakeNodeEnding = source.error === RESTAKE_NODE_ENDING_ERROR
  const isRestakeFetchFailed = source.error === RESTAKE_NODES_FETCH_FAILED_ERROR
  const isRestakeNodeUnusable =
    source.error === RESTAKE_NODE_UNAVAILABLE_ERROR ||
    isRestakeNodeFull ||
    isRestakeNodeEnding ||
    isRestakeFetchFailed

  // One-shot: a background refetch can flip the classification (e.g. FULL ↔
  // ENDING) while the alert is already up, and without the latch the effect
  // would stack a second alert on top of the first.
  const hasShownAlertRef = useRef(false)
  useEffect(() => {
    if (!isRestakeNodeUnusable || hasShownAlertRef.current) return
    hasShownAlertRef.current = true
    const nodeId = truncateNodeId(restakeNodeId ?? '')
    // Capacity copy mirrors core-web's `ReviewDelegationTx` toast.
    const description = isRestakeFetchFailed
      ? `We couldn't load the validator list. Please check your connection and try again.`
      : isRestakeNodeFull
      ? `Validator ${nodeId} is no longer eligible for staking. The capacity has been reached. Please select a different one.`
      : isRestakeNodeEnding
      ? `Validator ${nodeId} does not have enough time remaining in its validation period for a new stake. Please select a different one.`
      : `Validator ${nodeId} is no longer available for delegation. Please select a different one.`
    showAlert({
      title: isRestakeFetchFailed
        ? 'Unable to load validators'
        : 'Node unavailable',
      description,
      buttons: [
        {
          text: 'OK',
          onPress: () => replace('/addStakeV2/delegate/selectNode' as Href)
        }
      ]
    })
  }, [
    isRestakeNodeUnusable,
    isRestakeNodeFull,
    isRestakeNodeEnding,
    isRestakeFetchFailed,
    restakeNodeId,
    replace
  ])

  // Keep showing a spinner behind the alert (and while the redirect
  // settles) — rendering the confirm screen here would fire its generic
  // no-match alert on top.
  if (isRestakeNodeUnusable) {
    return <LoadingState sx={{ flex: 1 }} />
  }

  return <StakeConfirmScreen source={source} isAdvanced={true} />
}

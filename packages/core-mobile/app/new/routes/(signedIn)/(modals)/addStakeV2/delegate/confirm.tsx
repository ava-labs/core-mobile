import { LoadingState } from 'common/components/LoadingState'
import { showSnackbar } from 'common/utils/toast'
import { Href, useLocalSearchParams, useRouter } from 'expo-router'
import {
  RESTAKE_NODE_UNAVAILABLE_ERROR,
  useAdvancedReviewSource
} from 'features/stake/v2/hooks/useAdvancedReviewSource'
import StakeConfirmScreen from 'features/stake/v2/screens/StakeConfirmScreen'
import React, { useEffect } from 'react'
import { truncateNodeId } from 'utils/Utils'

/**
 * Advanced delegate confirm route. Feeds the user-selected validator (via
 * `useAdvancedReviewSource`) into the shared `StakeConfirmScreen` with
 * `isAdvanced` for analytics. A service fee applies when the
 * `delegation-fee-enabled` flag is on (see `useAdvancedReviewSource`).
 *
 * Restake lands here directly with a `restakeNodeId` param. When that
 * validator has left the active set, this wrapper redirects to the node
 * picker with a notice instead of rendering the confirm (which would fire
 * its generic no-match alert) — web parity with `StakingDelegatePage`'s
 * validator-not-found search fallback. The restake prefill (amount/duration)
 * stays active, so the picker flow reopens with the original stake's values.
 */
export default function DelegateConfirmRoute(): JSX.Element {
  const source = useAdvancedReviewSource()
  const { replace } = useRouter()
  const { restakeNodeId } = useLocalSearchParams<{ restakeNodeId?: string }>()
  const isRestakeNodeUnavailable =
    source.error === RESTAKE_NODE_UNAVAILABLE_ERROR

  useEffect(() => {
    if (!isRestakeNodeUnavailable) return
    showSnackbar(
      `Validator ${truncateNodeId(
        restakeNodeId ?? ''
      )} is no longer available for delegation. Please select a different one.`
    )
    replace('/addStakeV2/delegate/selectNode' as Href)
  }, [isRestakeNodeUnavailable, restakeNodeId, replace])

  // Keep showing a spinner while the redirect settles — rendering the
  // confirm screen here would flash its no-match alert first.
  if (isRestakeNodeUnavailable) {
    return <LoadingState sx={{ flex: 1 }} />
  }

  return <StakeConfirmScreen source={source} isAdvanced={true} />
}

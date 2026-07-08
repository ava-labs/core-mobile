import React from 'react'
import StakeConfirmScreen from 'features/stake/v2/screens/StakeConfirmScreen'
import { useAdvancedReviewSource } from 'features/stake/v2/hooks/useAdvancedReviewSource'

/**
 * Advanced delegate confirm route. Feeds the user-selected validator (via
 * `useAdvancedReviewSource`) into the shared `StakeConfirmScreen` with
 * `isAdvanced` for analytics. A service fee applies when the
 * `delegation-fee-enabled` flag is on (see `useAdvancedReviewSource`).
 */
export default function DelegateConfirmRoute(): JSX.Element {
  const source = useAdvancedReviewSource()
  return <StakeConfirmScreen source={source} isAdvanced={true} />
}

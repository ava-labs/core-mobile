import React from 'react'
import StakeConfirmScreen from 'features/stake/v2/screens/StakeConfirmScreen'
import { useFastStakeReviewSource } from 'features/stake/v2/hooks/useFastStakeReviewSource'

/**
 * Fast Stake confirm route. Acts as the seam between the file-based
 * route and the shared `StakeConfirmScreen` — calls the Fast Stake
 * source hook and feeds it in as the screen's `source` prop, along
 * with `isAdvanced={false}` for analytics labeling. When the advanced
 * delegate flow lands, it gets its own sibling route at
 * `delegate/confirm.tsx` that calls `useAdvancedReviewSource` with
 * `isAdvanced={true}` and reuses the same screen.
 */
export default function FastStakeConfirmRoute(): JSX.Element {
  const source = useFastStakeReviewSource()
  return <StakeConfirmScreen source={source} isAdvanced={false} />
}

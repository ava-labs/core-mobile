import { appReviewStore } from 'features/appReview/store'
import { requestInAppReview } from 'features/appReview/utils/requestInAppReview'
import AnalyticsService from 'services/analytics/AnalyticsService'

/**
 * Records a successful transaction and, if eligible, prompts the user for an app review.
 */
export function promptForAppReviewAfterSuccessfulTransaction(): void {
  // Record the transaction
  const state = appReviewStore.getState()
  state.recordSuccessfulTransaction()

  // If the user has not reached the threshold for prompting, return
  const stateAfterTxRecorded = appReviewStore.getState()
  if (!stateAfterTxRecorded.pendingPrompt) return

  // Request the review
  void requestInAppReview()

  // Mark the review as requested
  stateAfterTxRecorded.markReviewRequested()
  AnalyticsService.capture('InAppReviewRequested')
}

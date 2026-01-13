import { showAlert } from '@avalabs/k2-alpine'
import { appReviewStore } from 'features/appReview/store'
import { requestInAppReview } from 'features/appReview/utils/requestInAppReview'

/**
 * Records a successful transaction and, if eligible, prompts the user for an app review.
 */
export function promptForAppReviewAfterSuccessfulTransaction(): void {
  const state = appReviewStore.getState()
  state.recordSuccessfulTransaction()

  const stateAfterTxRecorded = appReviewStore.getState()
  if (!stateAfterTxRecorded.pendingPrompt) return

  // If the prompt has already been shown, request the review immediately.
  // We don't know if the user has already reviewed, so we skip showing our custom prompt again.
  // On Android, if the user has already reviewed, the in-app review won't be shown again.
  // On iOS, the OS controls when the review prompt appears and may delay it.
  if (stateAfterTxRecorded.promptShownCount > 0) {
    void requestInAppReview()
    return
  }

  // Otherwise, show the prompt and mark it as shown
  stateAfterTxRecorded.markPromptShown()
  showAlert({
    title: 'Do you like using Core?',
    buttons: [
      {
        text: 'Nope',
        onPress: () => appReviewStore.getState().decline()
      },
      {
        text: 'Yes',
        onPress: () => {
          void requestInAppReview({ fallbackToStore: true })
        }
      }
    ]
  })
}

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
          void requestInAppReview()
        }
      }
    ]
  })
}

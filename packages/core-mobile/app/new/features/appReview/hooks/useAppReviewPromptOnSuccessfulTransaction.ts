import { showAlert } from '@avalabs/k2-alpine'
import { useCallback } from 'react'
import { appReviewStore } from 'features/appReview/store'
import { requestInAppReview } from 'features/appReview/utils/requestInAppReview'

/**
 * Encapsulates the "after successful tx" app-review prompt flow.
 * Call the returned function when a successful transaction is confirmed/shown to the user.
 */
export function useAppReviewPromptOnSuccessfulTransaction(): () => void {
  return useCallback(() => {
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
            appReviewStore.getState().markCompleted()
          }
        }
      ]
    })
  }, [])
}

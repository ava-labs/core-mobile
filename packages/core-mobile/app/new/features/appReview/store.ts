import { ZustandStorageKeys } from 'resources/Constants'
import { zustandMMKVStorage } from 'utils/mmkv/storages'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getAppReviewConfig } from 'features/appReview/config'

const APP_REVIEW_CONFIG = getAppReviewConfig()

export interface AppReviewState {
  successfulTxCount: number
  pendingPrompt: boolean
  lastPromptAtMs?: number
  recordSuccessfulTransaction: () => void
  markReviewRequested: () => void
}

/**
 * Checks if the user can be prompted for a review based on the current state and the cooldown period.
 */
function canPromptNow(state: AppReviewState, nowMs: number): boolean {
  return (
    !state.pendingPrompt &&
    (state.lastPromptAtMs === undefined ||
      nowMs - state.lastPromptAtMs >= APP_REVIEW_CONFIG.cooldownMs)
  )
}

export const appReviewStore = create<AppReviewState>()(
  persist(
    (set, _get) => ({
      successfulTxCount: 0,
      pendingPrompt: false,
      lastPromptAtMs: undefined,

      /**
       * Records a successful transaction and updates the state accordingly.
       * If the user has not reached the threshold for prompting, the pendingPrompt state is not updated.
       */
      recordSuccessfulTransaction: () => {
        const nowMs = Date.now()
        set(state => {
          const nextCount = state.successfulTxCount + 1
          const next: Partial<AppReviewState> = { successfulTxCount: nextCount }

          if (
            nextCount >= APP_REVIEW_CONFIG.minSuccessfulTxForPrompt &&
            canPromptNow(state, nowMs)
          ) {
            next.pendingPrompt = true
          }

          return next
        })
      },

      /**
       * Marks the review as requested and updates the state accordingly.
       */
      markReviewRequested: () => {
        const nowMs = Date.now()
        set(state => {
          if (!state.pendingPrompt) return state
          return {
            ...state,
            pendingPrompt: false,
            lastPromptAtMs: nowMs
          }
        })
      }
    }),
    {
      name: ZustandStorageKeys.APP_REVIEW,
      storage: zustandMMKVStorage,
      version: 1
    }
  )
)

export const useAppReview = (): AppReviewState => appReviewStore()

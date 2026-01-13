import { ZustandStorageKeys } from 'resources/Constants'
import { zustandMMKVStorage } from 'utils/mmkv/storages'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getAppReviewConfig } from 'features/appReview/config'

const APP_REVIEW_CONFIG = getAppReviewConfig()

export interface AppReviewState {
  successfulTxCount: number

  pendingPrompt: boolean

  promptShownCount: number
  lastPromptAtMs?: number

  declineCount: number

  recordSuccessfulTransaction: () => void
  markPromptShown: () => void
  decline: () => void
}

function canPromptNow(state: AppReviewState, nowMs: number) {
  return (
    state.declineCount < 2 &&
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

      promptShownCount: 0,
      lastPromptAtMs: undefined,

      declineCount: 0,

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

      markPromptShown: () => {
        const nowMs = Date.now()
        set(state => {
          if (!state.pendingPrompt) return state
          return {
            ...state,
            pendingPrompt: false,
            promptShownCount: state.promptShownCount + 1,
            lastPromptAtMs: nowMs
          }
        })
      },

      decline: () => {
        set(state => {
          const nextDeclineCount = state.declineCount + 1

          // 1st "No" => snooze (re-prompt after cooldown, on next successful tx)
          if (nextDeclineCount < 2) {
            return {
              ...state,
              declineCount: nextDeclineCount,
              pendingPrompt: false
            }
          }

          // 2nd "No" => never prompt again
          return {
            ...state,
            declineCount: nextDeclineCount,
            pendingPrompt: false
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

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

  declined: boolean

  recordSuccessfulTransaction: () => void
  markPromptShown: () => void
  decline: () => void
}

function canPromptNow(state: AppReviewState, nowMs: number): boolean {
  return (
    !state.declined &&
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

      declined: false,

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
          return {
            ...state,
            declined: true
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

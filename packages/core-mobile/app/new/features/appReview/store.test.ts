import { appReviewStore } from './store'
import { getAppReviewConfig } from './config'

jest.mock('./config', () => ({
  getAppReviewConfig: jest.fn(() => ({
    minSuccessfulTxForPrompt: 2,
    cooldownMs: 1000 // 1 second for testing
  }))
}))

describe('appReviewStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    appReviewStore.setState({
      successfulTxCount: 0,
      pendingPrompt: false,
      lastPromptAtMs: undefined
    })
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = appReviewStore.getState()
      expect(state.successfulTxCount).toBe(0)
      expect(state.pendingPrompt).toBe(false)
      expect(state.lastPromptAtMs).toBeUndefined()
    })
  })

  describe('recordSuccessfulTransaction', () => {
    it('should increment successfulTxCount', () => {
      appReviewStore.getState().recordSuccessfulTransaction()
      expect(appReviewStore.getState().successfulTxCount).toBe(1)
    })

    it('should set pendingPrompt when threshold is met and can prompt', () => {
      const config = getAppReviewConfig()

      // Record transactions up to threshold
      for (let i = 0; i < config.minSuccessfulTxForPrompt; i++) {
        appReviewStore.getState().recordSuccessfulTransaction()
      }

      expect(appReviewStore.getState().pendingPrompt).toBe(true)
    })

    it('should not set pendingPrompt if threshold not met', () => {
      const config = getAppReviewConfig()

      // Record one less than threshold
      for (let i = 0; i < config.minSuccessfulTxForPrompt - 1; i++) {
        appReviewStore.getState().recordSuccessfulTransaction()
      }

      expect(appReviewStore.getState().pendingPrompt).toBe(false)
    })

    it('should not set pendingPrompt if already pending', () => {
      appReviewStore.setState({ pendingPrompt: true })

      appReviewStore.getState().recordSuccessfulTransaction()

      // Should still be true, not reset
      expect(appReviewStore.getState().pendingPrompt).toBe(true)
    })

    it('should not set pendingPrompt if within cooldown period', () => {
      const config = getAppReviewConfig()
      const now = Date.now()

      // Set lastPromptAtMs to recent time (within cooldown)
      appReviewStore.setState({
        lastPromptAtMs: now - 500 // 500ms ago, cooldown is 1000ms
      })

      // Record transactions up to threshold
      for (let i = 0; i < config.minSuccessfulTxForPrompt; i++) {
        appReviewStore.getState().recordSuccessfulTransaction()
      }

      expect(appReviewStore.getState().pendingPrompt).toBe(false)
    })

    it('should set pendingPrompt if cooldown period has passed', () => {
      const config = getAppReviewConfig()
      const now = Date.now()

      // Set lastPromptAtMs to time before cooldown
      appReviewStore.setState({
        lastPromptAtMs: now - config.cooldownMs - 100 // Past cooldown
      })

      // Record transactions up to threshold
      for (let i = 0; i < config.minSuccessfulTxForPrompt; i++) {
        appReviewStore.getState().recordSuccessfulTransaction()
      }

      expect(appReviewStore.getState().pendingPrompt).toBe(true)
    })
  })
})

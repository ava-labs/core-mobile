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
      promptShownCount: 0,
      lastPromptAtMs: undefined,
      declined: false
    })
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = appReviewStore.getState()
      expect(state.successfulTxCount).toBe(0)
      expect(state.pendingPrompt).toBe(false)
      expect(state.promptShownCount).toBe(0)
      expect(state.lastPromptAtMs).toBeUndefined()
      expect(state.declined).toBe(false)
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

    it('should not set pendingPrompt if declined', () => {
      appReviewStore.setState({ declined: true })

      const config = getAppReviewConfig()
      for (let i = 0; i < config.minSuccessfulTxForPrompt; i++) {
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

  describe('markPromptShown', () => {
    it('should update state when prompt is pending', () => {
      const now = Date.now()
      appReviewStore.setState({ pendingPrompt: true })

      appReviewStore.getState().markPromptShown()

      const state = appReviewStore.getState()
      expect(state.pendingPrompt).toBe(false)
      expect(state.promptShownCount).toBe(1)
      expect(state.lastPromptAtMs).toBeGreaterThanOrEqual(now)
    })

    it('should not update state when prompt is not pending', () => {
      const initialState = appReviewStore.getState()
      appReviewStore.setState({ pendingPrompt: false })

      appReviewStore.getState().markPromptShown()

      const state = appReviewStore.getState()
      expect(state.promptShownCount).toBe(initialState.promptShownCount)
      expect(state.lastPromptAtMs).toBe(initialState.lastPromptAtMs)
    })

    it('should increment promptShownCount on each call', () => {
      appReviewStore.setState({ pendingPrompt: true })
      appReviewStore.getState().markPromptShown()

      appReviewStore.setState({ pendingPrompt: true })
      appReviewStore.getState().markPromptShown()

      expect(appReviewStore.getState().promptShownCount).toBe(2)
    })
  })

  describe('decline', () => {
    it('should set declined to true', () => {
      appReviewStore.getState().decline()
      expect(appReviewStore.getState().declined).toBe(true)
    })

    it('should set declined to true even if called multiple times', () => {
      appReviewStore.getState().decline()
      appReviewStore.getState().decline()
      expect(appReviewStore.getState().declined).toBe(true)
    })
  })
})

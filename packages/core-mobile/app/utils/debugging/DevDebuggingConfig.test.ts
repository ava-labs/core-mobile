import config from './DevDebuggingConfig'

describe('DevDebuggingConfig', () => {
  describe('by default', () => {
    it('should have WDYR disabled', () => {
      expect(config.WDYR).toBe(false)
    })

    it('should not have storybook enabled', () => {
      expect(config.STORYBOOK_ENABLED).toBe(false)
    })

    it('should not show demo nfts', () => {
      expect(config.SHOW_DEMO_NFTS).toBe(false)
    })

    it('should not mock network request', () => {
      expect(config.API_MOCKING).toBe(false)
    })

    it('should not enable Sentry Spotlight', () => {
      expect(config.SENTRY_SPOTLIGHT).toBe(false)
    })
  })
})

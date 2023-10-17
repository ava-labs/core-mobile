import config from './DevDebuggingConfig'

describe('DevDebuggingConfig', () => {
  describe('by default', () => {
    it('should have WDYR disabled', () => {
      expect(config.WDYR).toBe(false)
    })

    it('should not have storybook enabled', () => {
      expect(config.STORYBOOK_ENABLED).toBe(false)
    })

    it('should not have logbox disabled', () => {
      expect(config.LOGBOX_DISABLED).toBe(false)
    })

    it('should not have redscreen disabled', () => {
      expect(config.REDSCREEN_DISABLED).toBe(false)
    })

    it('should not ignore any logbox warnings', () => {
      expect(config.LOGBOX_IGNORED_WARNINGS).toStrictEqual([])
    })

    it('should not show demo nfts', () => {
      expect(config.SHOW_DEMO_NFTS).toBe(false)
    })

    it('should not mock network request', () => {
      expect(config.API_MOCKING).toBe(false)
    })
  })
})

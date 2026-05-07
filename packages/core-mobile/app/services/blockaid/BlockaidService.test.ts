// TypeScript class fields and direct property assignment evaluate the RHS
// at construction time, which happens BEFORE the `const mockSiteScan` etc.
// declarations below (because `import BlockaidService` is hoisted above
// them). To work around that, the mock's `scan` properties wrap the mock
// fns in arrow functions; the arrow body resolves the identifier lazily on
// each call, by which time the const declarations have run.
jest.mock('@blockaid/client', () => {
  class MockBlockaid {
    site = {
      scan: (...args: unknown[]) =>
        (mockSiteScan as jest.Mock)(...(args as Parameters<jest.Mock>))
    }
  }
  ;(MockBlockaid as unknown as { default: unknown }).default = MockBlockaid
  return MockBlockaid
})

const mockSiteScan = jest.fn()

jest.mock('react-native-config', () => ({
  default: { PROXY_URL: 'https://proxy.example.test' }
}))

jest.mock('utils/Logger', () => ({
  default: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}))

import BlockaidService from './BlockaidService'

describe('BlockaidService', () => {
  beforeEach(() => {
    mockSiteScan.mockReset()
  })

  describe('scanSite', () => {
    it('forwards the URL to blockaid.site.scan', async () => {
      mockSiteScan.mockResolvedValue({ status: 'hit' })
      const result = await BlockaidService.scanSite('https://malicious.test')
      expect(mockSiteScan).toHaveBeenCalledWith({
        url: 'https://malicious.test'
      })
      expect(result).toEqual({ status: 'hit' })
    })
  })
})

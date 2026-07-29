import AppCheckService from 'services/fcm/AppCheckService'
import { getCoreAuthHeaders } from './getCoreAuthHeaders'

jest.mock('services/fcm/AppCheckService', () => ({
  getToken: jest.fn()
}))

jest.mock('react-native-config', () => ({
  CORE_API_KEY: undefined
}))

const Config = require('react-native-config')

const mockGetToken = AppCheckService.getToken as jest.MockedFunction<
  typeof AppCheckService.getToken
>

describe('getCoreAuthHeaders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Config.CORE_API_KEY = undefined
  })

  it('returns the AppCheck token header', async () => {
    mockGetToken.mockResolvedValue({ token: 'appcheck-token' } as Awaited<
      ReturnType<typeof AppCheckService.getToken>
    >)

    await expect(getCoreAuthHeaders()).resolves.toEqual({
      'X-Firebase-AppCheck': 'appcheck-token'
    })
  })

  it('includes the Core API key header when configured', async () => {
    Config.CORE_API_KEY = 'core-api-key'
    mockGetToken.mockResolvedValue({ token: 'appcheck-token' } as Awaited<
      ReturnType<typeof AppCheckService.getToken>
    >)

    await expect(getCoreAuthHeaders()).resolves.toEqual({
      'X-Firebase-AppCheck': 'appcheck-token',
      'x-core-api-key': 'core-api-key'
    })
  })

  it('re-reads the token on every call', async () => {
    mockGetToken
      .mockResolvedValueOnce({ token: 'token-1' } as Awaited<
        ReturnType<typeof AppCheckService.getToken>
      >)
      .mockResolvedValueOnce({ token: 'token-2' } as Awaited<
        ReturnType<typeof AppCheckService.getToken>
      >)

    await expect(getCoreAuthHeaders()).resolves.toEqual({
      'X-Firebase-AppCheck': 'token-1'
    })
    await expect(getCoreAuthHeaders()).resolves.toEqual({
      'X-Firebase-AppCheck': 'token-2'
    })
  })
})

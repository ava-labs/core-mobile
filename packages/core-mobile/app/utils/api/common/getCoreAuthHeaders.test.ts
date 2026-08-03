import AppCheckService from 'services/fcm/AppCheckService'
import { getCoreAuthHeaders } from './getCoreAuthHeaders'

jest.mock('services/fcm/AppCheckService', () => ({
  getToken: jest.fn()
}))

const mockGetToken = AppCheckService.getToken as jest.MockedFunction<
  typeof AppCheckService.getToken
>

describe('getCoreAuthHeaders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns only the AppCheck token header (no x-core-api-key)', async () => {
    mockGetToken.mockResolvedValue({ token: 'appcheck-token' } as Awaited<
      ReturnType<typeof AppCheckService.getToken>
    >)

    await expect(getCoreAuthHeaders()).resolves.toEqual({
      'X-Firebase-AppCheck': 'appcheck-token'
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

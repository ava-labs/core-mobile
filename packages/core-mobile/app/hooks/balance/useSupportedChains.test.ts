import { fetchSupportedChains } from './useSupportedChains'

jest.mock('contexts/ReactQueryProvider', () => ({
  queryClient: { fetchQuery: jest.fn() }
}))

jest.mock('utils/api/clients/balanceApiClient', () => ({
  balanceApiClient: {}
}))

const mockGetSupportedChains = jest.fn()
jest.mock('utils/api/generated/balanceApi.client', () => ({
  getV1BalanceGetSupportedChains: (...args: unknown[]) =>
    mockGetSupportedChains(...args)
}))

describe('fetchSupportedChains', () => {
  beforeEach(() => {
    mockGetSupportedChains.mockReset()
  })

  it('returns the caip2 ids on success', async () => {
    mockGetSupportedChains.mockResolvedValue({
      data: { caip2Ids: ['eip155:43114', 'bip122:000000000019d6689c085ae1'] },
      response: { status: 200 }
    })

    await expect(fetchSupportedChains()).resolves.toEqual([
      'eip155:43114',
      'bip122:000000000019d6689c085ae1'
    ])
  })

  it('includes the http status in the error when the api fails', async () => {
    mockGetSupportedChains.mockResolvedValue({
      error: { message: 'forbidden' },
      response: { status: 403 }
    })

    await expect(fetchSupportedChains()).rejects.toThrow(
      'Failed to fetch supported chains (HTTP 403)'
    )
  })

  it('reports an unknown status when no response is available', async () => {
    mockGetSupportedChains.mockResolvedValue({})

    await expect(fetchSupportedChains()).rejects.toThrow(
      'Failed to fetch supported chains (HTTP unknown)'
    )
  })
})

import { renderHook } from '@testing-library/react-hooks'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useTokenLookup } from './useTokenLookup'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn()
}))

jest.mock('utils/api/generated/tokenAggregator/aggregatorApi.client', () => ({
  postV1TokenLookup: jest.fn()
}))

jest.mock('utils/api/clients/aggregatedTokensApiClient', () => ({
  tokenAggregatorApi: {}
}))

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>

describe('useTokenLookup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false } as any)
  })

  describe('query key construction (tokenToKey)', () => {
    it('builds an internalId key in lowercase', () => {
      renderHook(() => useTokenLookup([{ internalId: 'NATIVE-AVAX' }]))

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: [ReactQueryKeys.TOKEN_LOOKUP, ['native-avax']]
        })
      )
    })

    it('builds a caip2Id:address key in lowercase', () => {
      renderHook(() =>
        useTokenLookup([{ caip2Id: 'eip155:43114', address: '0xABCDEF1234' }])
      )

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: [ReactQueryKeys.TOKEN_LOOKUP, ['eip155:43114:0xabcdef1234']]
        })
      )
    })

    it('produces the same key for checksummed and lowercase address variants', () => {
      renderHook(() =>
        useTokenLookup([{ caip2Id: 'eip155:43114', address: '0xAbCd' }])
      )
      const checksummedKey = mockUseQuery.mock.calls[0]?.[0].queryKey

      mockUseQuery.mockClear()

      renderHook(() =>
        useTokenLookup([{ caip2Id: 'eip155:43114', address: '0xabcd' }])
      )
      const lowercasedKey = mockUseQuery.mock.calls[0]?.[0].queryKey

      expect(checksummedKey).toEqual(lowercasedKey)
    })

    it('builds separate keys for different tokens', () => {
      renderHook(() =>
        useTokenLookup([
          { internalId: 'NATIVE-avax' },
          { caip2Id: 'eip155:43114', address: '0xabc' }
        ])
      )

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: [
            ReactQueryKeys.TOKEN_LOOKUP,
            ['native-avax', 'eip155:43114:0xabc']
          ]
        })
      )
    })
  })

  describe('enabled flag', () => {
    it('disables the query when tokens is empty', () => {
      renderHook(() => useTokenLookup([]))

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false })
      )
    })

    it('enables the query when tokens is non-empty', () => {
      renderHook(() => useTokenLookup([{ internalId: 'NATIVE-avax' }]))

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true })
      )
    })
  })

  describe('return value', () => {
    it('returns an empty object when data is undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUseQuery.mockReturnValue({ data: undefined, isLoading: false } as any)

      const { result } = renderHook(() =>
        useTokenLookup([{ internalId: 'NATIVE-avax' }])
      )

      expect(result.current.data).toEqual({})
    })

    it('returns the data map when data is defined', () => {
      const mockData = {
        'native-avax': { symbol: 'AVAX', name: 'Avalanche' },
        'eip155:43114:0xabc': { symbol: 'USDC', name: 'USD Coin' }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUseQuery.mockReturnValue({ data: mockData, isLoading: false } as any)

      const { result } = renderHook(() =>
        useTokenLookup([
          { internalId: 'NATIVE-avax' },
          { caip2Id: 'eip155:43114', address: '0xabc' }
        ])
      )

      expect(result.current.data).toEqual(mockData)
    })

    it('forwards isLoading from useQuery', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUseQuery.mockReturnValue({ data: undefined, isLoading: true } as any)

      const { result } = renderHook(() =>
        useTokenLookup([{ internalId: 'NATIVE-avax' }])
      )

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('queryFn', () => {
    it('passes the original (non-normalised) token objects to the API', async () => {
      const tokens = [
        { caip2Id: 'eip155:43114', address: '0xABC' },
        { internalId: 'NATIVE-avax' }
      ]
      const { postV1TokenLookup } = jest.requireMock(
        'utils/api/generated/tokenAggregator/aggregatorApi.client'
      )
      postV1TokenLookup.mockResolvedValue({ data: { data: {} } })

      let capturedQueryFn: (() => Promise<unknown>) | undefined
      mockUseQuery.mockImplementation(options => {
        capturedQueryFn = options.queryFn as () => Promise<unknown>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { data: undefined, isLoading: false } as any
      })

      renderHook(() => useTokenLookup(tokens))

      await capturedQueryFn?.()

      expect(postV1TokenLookup).toHaveBeenCalledWith(
        expect.objectContaining({ body: { tokens } })
      )
    })

    it('returns an empty object when the API response has no data', async () => {
      const { postV1TokenLookup } = jest.requireMock(
        'utils/api/generated/tokenAggregator/aggregatorApi.client'
      )
      postV1TokenLookup.mockResolvedValue({ data: null })

      let capturedQueryFn: (() => Promise<unknown>) | undefined
      mockUseQuery.mockImplementation(options => {
        capturedQueryFn = options.queryFn as () => Promise<unknown>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { data: undefined, isLoading: false } as any
      })

      renderHook(() => useTokenLookup([{ internalId: 'NATIVE-avax' }]))

      const result = await capturedQueryFn?.()

      expect(result).toEqual({})
    })
  })
})

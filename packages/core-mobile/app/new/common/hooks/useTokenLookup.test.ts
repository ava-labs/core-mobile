import { renderHook } from '@testing-library/react-hooks'
import { useQueries } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useTokenLookup } from './useTokenLookup'

jest.mock('@tanstack/react-query', () => ({
  useQueries: jest.fn()
}))

jest.mock('utils/api/generated/tokenAggregator/aggregatorApi.client', () => ({
  postV1TokenLookup: jest.fn()
}))

jest.mock('utils/api/clients/aggregatedTokensApiClient', () => ({
  tokenAggregatorApi: {}
}))

const mockUseQueries = useQueries as jest.MockedFunction<typeof useQueries>

describe('useTokenLookup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseQueries.mockReturnValue({ data: {}, isLoading: false } as any)
  })

  describe('query key construction (tokenToKey)', () => {
    it('builds an internalId key in lowercase', () => {
      renderHook(() => useTokenLookup([{ internalId: 'NATIVE-AVAX' }]))

      expect(mockUseQueries).toHaveBeenCalledWith(
        expect.objectContaining({
          queries: [
            expect.objectContaining({
              queryKey: [ReactQueryKeys.TOKEN_LOOKUP, 'native-avax']
            })
          ]
        })
      )
    })

    it('builds a caip2Id:address key in lowercase', () => {
      renderHook(() =>
        useTokenLookup([{ caip2Id: 'eip155:43114', address: '0xABCDEF1234' }])
      )

      expect(mockUseQueries).toHaveBeenCalledWith(
        expect.objectContaining({
          queries: [
            expect.objectContaining({
              queryKey: [
                ReactQueryKeys.TOKEN_LOOKUP,
                'eip155:43114:0xabcdef1234'
              ]
            })
          ]
        })
      )
    })

    it('produces the same key for checksummed and lowercase address variants', () => {
      renderHook(() =>
        useTokenLookup([{ caip2Id: 'eip155:43114', address: '0xAbCd' }])
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const checksummedKey = (mockUseQueries.mock.calls[0]?.[0] as any)
        .queries[0].queryKey

      mockUseQueries.mockClear()

      renderHook(() =>
        useTokenLookup([{ caip2Id: 'eip155:43114', address: '0xabcd' }])
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lowercasedKey = (mockUseQueries.mock.calls[0]?.[0] as any)
        .queries[0].queryKey

      expect(checksummedKey).toEqual(lowercasedKey)
    })

    it('deduplicates tokens with the same key before building queries', () => {
      renderHook(() =>
        useTokenLookup([
          { internalId: 'NATIVE-avax' },
          { internalId: 'native-avax' } // duplicate — different casing, same key
        ])
      )

      expect(mockUseQueries).toHaveBeenCalledWith(
        expect.objectContaining({
          queries: [
            expect.objectContaining({
              queryKey: [ReactQueryKeys.TOKEN_LOOKUP, 'native-avax']
            })
          ]
        })
      )
    })

    it('builds a separate query entry per token', () => {
      renderHook(() =>
        useTokenLookup([
          { internalId: 'NATIVE-avax' },
          { caip2Id: 'eip155:43114', address: '0xabc' }
        ])
      )

      expect(mockUseQueries).toHaveBeenCalledWith(
        expect.objectContaining({
          queries: [
            expect.objectContaining({
              queryKey: [ReactQueryKeys.TOKEN_LOOKUP, 'native-avax']
            }),
            expect.objectContaining({
              queryKey: [ReactQueryKeys.TOKEN_LOOKUP, 'eip155:43114:0xabc']
            })
          ]
        })
      )
    })
  })

  describe('empty tokens', () => {
    it('passes an empty queries array when tokens is empty', () => {
      renderHook(() => useTokenLookup([]))

      expect(mockUseQueries).toHaveBeenCalledWith(
        expect.objectContaining({ queries: [] })
      )
    })
  })

  describe('return value', () => {
    it('returns the combined data map from useQueries', () => {
      const mockData = { 'native-avax': { symbol: 'AVAX', name: 'Avalanche' } }
      mockUseQueries.mockReturnValue({
        data: mockData,
        isLoading: false
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      const { result } = renderHook(() =>
        useTokenLookup([{ internalId: 'NATIVE-avax' }])
      )

      expect(result.current.data).toEqual(mockData)
    })

    it('forwards isLoading from useQueries', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUseQueries.mockReturnValue({ data: {}, isLoading: true } as any)

      const { result } = renderHook(() =>
        useTokenLookup([{ internalId: 'NATIVE-avax' }])
      )

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('combine', () => {
    it('merges data from all per-token results', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUseQueries.mockImplementation(({ combine }: any) => {
        return combine([
          { data: { 'native-avax': { symbol: 'AVAX' } }, isLoading: false },
          {
            data: { 'eip155:43114:0xabc': { symbol: 'USDC' } },
            isLoading: false
          }
        ])
      })

      const { result } = renderHook(() =>
        useTokenLookup([
          { internalId: 'NATIVE-avax' },
          { caip2Id: 'eip155:43114', address: '0xabc' }
        ])
      )

      expect(result.current.data).toEqual({
        'native-avax': { symbol: 'AVAX' },
        'eip155:43114:0xabc': { symbol: 'USDC' }
      })
      expect(result.current.isLoading).toBe(false)
    })

    it('reports isLoading true when any query is still loading', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUseQueries.mockImplementation(({ combine }: any) => {
        return combine([
          { data: { 'native-avax': { symbol: 'AVAX' } }, isLoading: false },
          { data: undefined, isLoading: true }
        ])
      })

      const { result } = renderHook(() =>
        useTokenLookup([
          { internalId: 'NATIVE-avax' },
          { caip2Id: 'eip155:43114', address: '0xabc' }
        ])
      )

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('queryFn', () => {
    it('passes a single token to the API per query', async () => {
      const token = { caip2Id: 'eip155:43114', address: '0xABC' }
      const { postV1TokenLookup } = jest.requireMock(
        'utils/api/generated/tokenAggregator/aggregatorApi.client'
      )
      postV1TokenLookup.mockResolvedValue({ data: { data: {} } })

      let capturedQueryFn: (() => Promise<unknown>) | undefined
      mockUseQueries.mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ queries }: any) => {
          capturedQueryFn = queries[0]?.queryFn
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return { data: {}, isLoading: false } as any
        }
      )

      renderHook(() => useTokenLookup([token]))

      await capturedQueryFn?.()

      expect(postV1TokenLookup).toHaveBeenCalledWith(
        expect.objectContaining({ body: { tokens: [token] } })
      )
    })

    it('returns an empty object when the API response has no data', async () => {
      const { postV1TokenLookup } = jest.requireMock(
        'utils/api/generated/tokenAggregator/aggregatorApi.client'
      )
      postV1TokenLookup.mockResolvedValue({ data: null })

      let capturedQueryFn: (() => Promise<unknown>) | undefined
      mockUseQueries.mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ queries }: any) => {
          capturedQueryFn = queries[0]?.queryFn
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return { data: {}, isLoading: false } as any
        }
      )

      renderHook(() => useTokenLookup([{ internalId: 'NATIVE-avax' }]))

      const result = await capturedQueryFn?.()

      expect(result).toEqual({})
    })
  })
})

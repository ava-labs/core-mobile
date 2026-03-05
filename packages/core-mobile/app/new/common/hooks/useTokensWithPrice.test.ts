import { renderHook } from '@testing-library/react-hooks'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useTokensWithPrice } from './useTokensWithPrice'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn()
  // useMemo is used from React, not react-query — keep real react
}))

jest.mock('utils/api/generated/tokenAggregator/aggregatorApi.client', () => ({
  postV1TokenLookupWithPrice: jest.fn()
}))

jest.mock('utils/api/clients/aggregatedTokensApiClient', () => ({
  tokenAggregatorApi: {}
}))

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>

describe('useTokensWithPrice', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseQuery.mockReturnValue({ data: undefined } as any)
  })

  describe('query key construction (tokenToKey)', () => {
    it('builds an internalId key in lowercase', () => {
      renderHook(() => useTokensWithPrice([{ internalId: 'NATIVE-AVAX' }]))

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: [ReactQueryKeys.TOKEN_LOOKUP_WITH_PRICE, ['native-avax']]
        })
      )
    })

    it('builds a caip2Id:address key in lowercase', () => {
      renderHook(() =>
        useTokensWithPrice([
          { caip2Id: 'eip155:43114', address: '0xABCDEF1234' }
        ])
      )

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: [
            ReactQueryKeys.TOKEN_LOOKUP_WITH_PRICE,
            ['eip155:43114:0xabcdef1234']
          ]
        })
      )
    })

    it('produces the same key for checksummed and lowercase address variants', () => {
      renderHook(() =>
        useTokensWithPrice([{ caip2Id: 'eip155:43114', address: '0xAbCd' }])
      )
      const checksummedKey = mockUseQuery.mock.calls[0]?.[0].queryKey

      mockUseQuery.mockClear()

      renderHook(() =>
        useTokensWithPrice([{ caip2Id: 'eip155:43114', address: '0xabcd' }])
      )
      const lowercasedKey = mockUseQuery.mock.calls[0]?.[0].queryKey

      expect(checksummedKey).toEqual(lowercasedKey)
    })

    it('builds separate keys for different tokens', () => {
      renderHook(() =>
        useTokensWithPrice([
          { internalId: 'NATIVE-avax' },
          { caip2Id: 'eip155:43114', address: '0xabc' }
        ])
      )

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: [
            ReactQueryKeys.TOKEN_LOOKUP_WITH_PRICE,
            ['native-avax', 'eip155:43114:0xabc']
          ]
        })
      )
    })
  })

  describe('enabled flag', () => {
    it('disables the query when tokens is empty', () => {
      renderHook(() => useTokensWithPrice([]))

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false })
      )
    })

    it('enables the query when tokens is non-empty', () => {
      renderHook(() => useTokensWithPrice([{ internalId: 'NATIVE-avax' }]))

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true })
      )
    })
  })

  describe('return value', () => {
    it('returns an empty array when data is undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUseQuery.mockReturnValue({ data: undefined } as any)

      const { result } = renderHook(() =>
        useTokensWithPrice([{ internalId: 'NATIVE-avax' }])
      )

      expect(result.current).toEqual([])
    })

    it('returns a flat array of all token data values', () => {
      const mockData = {
        token1: { symbol: 'AVAX', name: 'Avalanche' },
        token2: { symbol: 'ETH', name: 'Ethereum' }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUseQuery.mockReturnValue({ data: mockData } as any)

      const { result } = renderHook(() =>
        useTokensWithPrice([
          { internalId: 'NATIVE-avax' },
          { internalId: 'NATIVE-eth' }
        ])
      )

      expect(result.current).toEqual(Object.values(mockData))
    })
  })

  describe('queryFn', () => {
    it('passes the original (non-normalised) token objects to the API', async () => {
      const tokens = [
        { caip2Id: 'eip155:43114', address: '0xABC' },
        { internalId: 'NATIVE-avax' }
      ]
      const { postV1TokenLookupWithPrice } = jest.requireMock(
        'utils/api/generated/tokenAggregator/aggregatorApi.client'
      )
      postV1TokenLookupWithPrice.mockResolvedValue({ data: { data: {} } })

      let capturedQueryFn: (() => Promise<unknown>) | undefined
      mockUseQuery.mockImplementation(options => {
        capturedQueryFn = options.queryFn as () => Promise<unknown>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { data: undefined } as any
      })

      renderHook(() => useTokensWithPrice(tokens))

      await capturedQueryFn?.()

      expect(postV1TokenLookupWithPrice).toHaveBeenCalledWith(
        expect.objectContaining({ body: { tokens } })
      )
    })

    it('returns an empty object when the API response has no data', async () => {
      const { postV1TokenLookupWithPrice } = jest.requireMock(
        'utils/api/generated/tokenAggregator/aggregatorApi.client'
      )
      postV1TokenLookupWithPrice.mockResolvedValue({ data: null })

      let capturedQueryFn: (() => Promise<unknown>) | undefined
      mockUseQuery.mockImplementation(options => {
        capturedQueryFn = options.queryFn as () => Promise<unknown>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { data: undefined } as any
      })

      renderHook(() => useTokensWithPrice([{ internalId: 'NATIVE-avax' }]))

      const result = await capturedQueryFn?.()

      expect(result).toEqual({})
    })
  })
})

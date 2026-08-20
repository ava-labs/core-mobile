import {
  lookupTokens,
  TOKEN_LOOKUP_CHUNK_SIZE,
  type LookupToken
} from './tokenLookupRequest'

jest.mock('utils/api/generated/tokenAggregator/aggregatorApi.client', () => ({
  postV1TokenLookup: jest.fn()
}))

jest.mock('utils/api/clients/aggregatedTokensApiClient', () => ({
  tokenAggregatorApi: {}
}))

const { postV1TokenLookup } = jest.requireMock(
  'utils/api/generated/tokenAggregator/aggregatorApi.client'
) as { postV1TokenLookup: jest.Mock }

const CAIP2 = 'eip155:43114'
const SOLANA_CAIP2 = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'
const USDC_SOLANA_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

const pair = (n: number): LookupToken => ({
  caip2Id: CAIP2,
  address: `0x${n.toString(16).padStart(40, '0')}`
})

const pairs = (count: number): LookupToken[] =>
  Array.from({ length: count }, (_, n) => pair(n))

const resolved = (data: Record<string, unknown> = {}): unknown => ({
  data: { data }
})

const bodyTokensOf = (callIndex: number): LookupToken[] =>
  postV1TokenLookup.mock.calls[callIndex][0].body.tokens

describe('lookupTokens', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    postV1TokenLookup.mockResolvedValue(resolved())
  })

  describe('empty input', () => {
    it('makes no request and returns an empty result', async () => {
      const result = await lookupTokens([])

      expect(postV1TokenLookup).not.toHaveBeenCalled()
      expect(result).toEqual({ data: {}, failedTokens: [] })
    })
  })

  describe('chunking', () => {
    it.each([
      [TOKEN_LOOKUP_CHUNK_SIZE - 1, 1],
      [TOKEN_LOOKUP_CHUNK_SIZE, 1],
      [TOKEN_LOOKUP_CHUNK_SIZE + 1, 2]
    ])('splits %i tokens into %i request(s)', async (count, expected) => {
      await lookupTokens(pairs(count))

      expect(postV1TokenLookup).toHaveBeenCalledTimes(expected)
    })

    it('never exceeds the chunk size in a single request body', async () => {
      await lookupTokens(pairs(1200))

      expect(postV1TokenLookup).toHaveBeenCalledTimes(3)
      expect(bodyTokensOf(0)).toHaveLength(TOKEN_LOOKUP_CHUNK_SIZE)
      expect(bodyTokensOf(1)).toHaveLength(TOKEN_LOOKUP_CHUNK_SIZE)
      expect(bodyTokensOf(2)).toHaveLength(200)
    })

    it('sends every token exactly once, in order', async () => {
      const tokens = pairs(TOKEN_LOOKUP_CHUNK_SIZE + 3)

      await lookupTokens(tokens)

      expect([...bodyTokensOf(0), ...bodyTokensOf(1)]).toEqual(tokens)
    })
  })

  describe('request shape', () => {
    it('posts through the aggregator client', async () => {
      const tokens = [pair(1)]

      await lookupTokens(tokens)

      expect(postV1TokenLookup).toHaveBeenCalledWith({
        client: {},
        body: { tokens }
      })
    })

    it('accepts internalId tokens', async () => {
      const tokens: LookupToken[] = [{ internalId: 'NATIVE-AVAX' }]

      await lookupTokens(tokens)

      expect(bodyTokensOf(0)).toEqual(tokens)
    })
  })

  describe('successful responses', () => {
    it('merges the entries of every chunk', async () => {
      postV1TokenLookup
        .mockResolvedValueOnce(resolved({ 'key-a': { symbol: 'AAA' } }))
        .mockResolvedValueOnce(resolved({ 'key-b': { symbol: 'BBB' } }))

      const { data, failedTokens } = await lookupTokens(
        pairs(TOKEN_LOOKUP_CHUNK_SIZE + 1)
      )

      expect(data).toEqual({
        'key-a': { symbol: 'AAA' },
        'key-b': { symbol: 'BBB' }
      })
      expect(failedTokens).toEqual([])
    })

    it('leaves response keys in the casing the server returned', async () => {
      const serverKey = `${SOLANA_CAIP2}-${USDC_SOLANA_MINT}`
      postV1TokenLookup.mockResolvedValue(
        resolved({ [serverKey]: { symbol: 'USDC' } })
      )

      const { data } = await lookupTokens([
        { caip2Id: SOLANA_CAIP2, address: USDC_SOLANA_MINT }
      ])

      expect(Object.keys(data)).toEqual([serverKey])
    })

    it('treats a token missing from a successful response as absent, not failed', async () => {
      postV1TokenLookup.mockResolvedValue(resolved())

      const { data, failedTokens } = await lookupTokens([pair(1)])

      expect(data).toEqual({})
      expect(failedTokens).toEqual([])
    })

    it('tolerates a response with no data payload', async () => {
      postV1TokenLookup.mockResolvedValue({ data: null })

      const { data, failedTokens } = await lookupTokens([pair(1)])

      expect(data).toEqual({})
      expect(failedTokens).toEqual([])
    })
  })

  describe('failed chunks', () => {
    it('keeps a fulfilled chunk and reports only the failed chunk’s tokens', async () => {
      const tokens = pairs(TOKEN_LOOKUP_CHUNK_SIZE + 2)
      postV1TokenLookup
        .mockResolvedValueOnce(resolved({ 'key-a': { symbol: 'AAA' } }))
        .mockRejectedValueOnce(new Error('INVALID_PAYLOAD'))

      const { data, failedTokens } = await lookupTokens(tokens)

      expect(data).toEqual({ 'key-a': { symbol: 'AAA' } })
      expect(failedTokens).toEqual(tokens.slice(TOKEN_LOOKUP_CHUNK_SIZE))
    })

    it('reports the caller’s own token objects so they can be matched by identity', async () => {
      const tokens = pairs(TOKEN_LOOKUP_CHUNK_SIZE + 1)
      postV1TokenLookup
        .mockResolvedValueOnce(resolved())
        .mockRejectedValueOnce(new Error('network down'))

      const { failedTokens } = await lookupTokens(tokens)

      expect(failedTokens).toHaveLength(1)
      expect(failedTokens[0]).toBe(tokens[TOKEN_LOOKUP_CHUNK_SIZE])
    })

    it('returns every token as failed when all chunks fail', async () => {
      const tokens = pairs(TOKEN_LOOKUP_CHUNK_SIZE + 1)
      postV1TokenLookup.mockRejectedValue(new Error('network down'))

      const { data, failedTokens } = await lookupTokens(tokens)

      expect(data).toEqual({})
      expect(failedTokens).toEqual(tokens)
    })

    it('does not reject when a chunk fails', async () => {
      postV1TokenLookup.mockRejectedValue(new Error('network down'))

      await expect(lookupTokens([pair(1)])).resolves.toEqual({
        data: {},
        failedTokens: [pair(1)]
      })
    })
  })
})

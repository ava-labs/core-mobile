import { enqueueTokenLookup } from './tokenLookupQueue'
import type { LookupToken, TokenLookupResult } from './tokenLookupRequest'

jest.mock('./tokenLookupRequest', () => ({
  lookupTokens: jest.fn()
}))

const { lookupTokens } = jest.requireMock('./tokenLookupRequest') as {
  lookupTokens: jest.Mock
}

const CAIP2 = 'eip155:43114'

const A: LookupToken = { caip2Id: CAIP2, address: '0xAAA' }
const B: LookupToken = { caip2Id: CAIP2, address: '0xBBB' }
const C: LookupToken = { caip2Id: CAIP2, address: '0xCCC' }

const keyOf = (token: LookupToken): string =>
  'internalId' in token
    ? token.internalId.toLowerCase()
    : `${token.caip2Id}-${token.address}`.toLowerCase()

const info = (symbol: string): { symbol: string } => ({ symbol })

const succeed = (entries: Array<[LookupToken, string]>): TokenLookupResult =>
  ({
    data: Object.fromEntries(
      entries.map(([token, symbol]) => [keyOf(token), info(symbol)])
    ),
    failedTokens: []
  } as unknown as TokenLookupResult)

const tokensOf = (callIndex: number): LookupToken[] =>
  lookupTokens.mock.calls[callIndex][0]

// Every test below drains the queue it creates, and `flush` clears both the
// queue and the scheduled flag even on failure, so the module-level state is
// clean between tests without resetting modules.
describe('enqueueTokenLookup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('coalescing', () => {
    it('sends every token enqueued in the same tick as one request', async () => {
      lookupTokens.mockResolvedValue(
        succeed([
          [A, 'AAA'],
          [B, 'BBB'],
          [C, 'CCC']
        ])
      )

      await Promise.all([
        enqueueTokenLookup(A),
        enqueueTokenLookup(B),
        enqueueTokenLookup(C)
      ])

      expect(lookupTokens).toHaveBeenCalledTimes(1)
      expect(tokensOf(0)).toEqual([A, B, C])
    })

    it('gives each caller only its own entry', async () => {
      lookupTokens.mockResolvedValue(
        succeed([
          [A, 'AAA'],
          [B, 'BBB']
        ])
      )

      const [resultA, resultB] = await Promise.all([
        enqueueTokenLookup(A),
        enqueueTokenLookup(B)
      ])

      expect(resultA).toEqual({ [keyOf(A)]: info('AAA') })
      expect(resultB).toEqual({ [keyOf(B)]: info('BBB') })
    })

    it('starts a fresh batch once the previous one has settled', async () => {
      lookupTokens.mockResolvedValue(succeed([[A, 'AAA']]))
      await enqueueTokenLookup(A)

      lookupTokens.mockResolvedValue(succeed([[B, 'BBB']]))
      await enqueueTokenLookup(B)

      expect(lookupTokens).toHaveBeenCalledTimes(2)
      expect(tokensOf(0)).toEqual([A])
      expect(tokensOf(1)).toEqual([B])
    })
  })

  describe('tokens the server did not return', () => {
    it('resolves empty rather than rejecting', async () => {
      lookupTokens.mockResolvedValue(succeed([[A, 'AAA']]))

      const [resultA, resultB] = await Promise.all([
        enqueueTokenLookup(A),
        enqueueTokenLookup(B)
      ])

      expect(resultA).toEqual({ [keyOf(A)]: info('AAA') })
      expect(resultB).toEqual({})
    })
  })

  describe('failures', () => {
    it('rejects the failed tokens and resolves the rest', async () => {
      lookupTokens.mockResolvedValue({
        data: { [keyOf(A)]: info('AAA') },
        failedTokens: [B]
      })

      const settled = await Promise.allSettled([
        enqueueTokenLookup(A),
        enqueueTokenLookup(B)
      ])

      expect(settled[0]).toEqual({
        status: 'fulfilled',
        value: { [keyOf(A)]: info('AAA') }
      })
      expect(settled[1]?.status).toBe('rejected')
    })

    it('rejects every caller when the request itself throws', async () => {
      const boom = new Error('network down')
      lookupTokens.mockRejectedValue(boom)

      const settled = await Promise.allSettled([
        enqueueTokenLookup(A),
        enqueueTokenLookup(B)
      ])

      expect(settled.map(result => result.status)).toEqual([
        'rejected',
        'rejected'
      ])
      settled.forEach(result => {
        expect((result as PromiseRejectedResult).reason).toBe(boom)
      })
    })

    it('settles every caller even when a batch fails, leaving nothing pending', async () => {
      lookupTokens.mockRejectedValue(new Error('network down'))

      // If flush left promises unsettled these awaits would hang rather than
      // fail, so reaching the assertion at all is the point of this test.
      await Promise.allSettled([enqueueTokenLookup(A), enqueueTokenLookup(B)])

      lookupTokens.mockResolvedValue(succeed([[C, 'CCC']]))

      await expect(enqueueTokenLookup(C)).resolves.toEqual({
        [keyOf(C)]: info('CCC')
      })
    })
  })

  describe('a token enqueued while a request is in flight', () => {
    it('goes into the next batch instead of being dropped', async () => {
      let releaseFirst!: (value: TokenLookupResult) => void
      lookupTokens
        .mockImplementationOnce(
          () =>
            new Promise<TokenLookupResult>(resolve => {
              releaseFirst = resolve
            })
        )
        .mockResolvedValueOnce(succeed([[B, 'BBB']]))

      const first = enqueueTokenLookup(A)

      // Let the scheduled flush run: it takes A, clears the queue, and awaits.
      await Promise.resolve()
      expect(lookupTokens).toHaveBeenCalledTimes(1)

      const second = enqueueTokenLookup(B)

      releaseFirst(succeed([[A, 'AAA']]))

      await expect(first).resolves.toEqual({ [keyOf(A)]: info('AAA') })
      await expect(second).resolves.toEqual({ [keyOf(B)]: info('BBB') })

      expect(lookupTokens).toHaveBeenCalledTimes(2)
      expect(tokensOf(0)).toEqual([A])
      expect(tokensOf(1)).toEqual([B])
    })
  })
})

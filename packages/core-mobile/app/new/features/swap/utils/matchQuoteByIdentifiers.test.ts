import type { Quote } from '../types'
import { matchQuoteByIdentifiers } from './matchQuoteByIdentifiers'

const makeQuote = (
  id: string,
  serviceType: string,
  aggregatorId: string
): Quote =>
  ({
    id,
    serviceType,
    aggregator: { id: aggregatorId }
  } as unknown as Quote)

describe('matchQuoteByIdentifiers', () => {
  const markr123 = makeQuote('markr-123', 'MARKR', 'markr')
  const debridge456 = makeQuote('debridge-456', 'MARKR', 'debridge')
  const avaxEvm = makeQuote('avax-789', 'AVALANCHE_EVM', 'avalanche-evm')

  it('returns the exact match by quoteId', () => {
    const match = matchQuoteByIdentifiers(
      {
        quoteId: 'markr-123',
        serviceType: 'MARKR',
        aggregatorId: 'markr'
      },
      [markr123, debridge456, avaxEvm]
    )

    expect(match).toBe(markr123)
  })

  it('falls back to serviceType + aggregatorId when quoteId has rotated', () => {
    // Stream refresh rotated Markr's quote id from 123 → 999 but the
    // provider is still the same; we should resolve to the new quote.
    const markr999 = makeQuote('markr-999', 'MARKR', 'markr')
    const match = matchQuoteByIdentifiers(
      {
        quoteId: 'markr-123',
        serviceType: 'MARKR',
        aggregatorId: 'markr'
      },
      [markr999, debridge456]
    )

    expect(match).toBe(markr999)
  })

  it('prefers the exact match over the fallback when both exist', () => {
    // Edge case: somehow both the exact id and a same-provider quote exist.
    // Exact should win.
    const markr123Duplicate = makeQuote('markr-123', 'MARKR', 'markr')
    const anotherMarkr = makeQuote('markr-456', 'MARKR', 'markr')
    const match = matchQuoteByIdentifiers(
      {
        quoteId: 'markr-123',
        serviceType: 'MARKR',
        aggregatorId: 'markr'
      },
      [anotherMarkr, markr123Duplicate]
    )

    expect(match).toBe(markr123Duplicate)
  })

  it('returns null when identifiers is null', () => {
    expect(matchQuoteByIdentifiers(null, [markr123, debridge456])).toBeNull()
  })

  it('returns null when no exact and no fallback match', () => {
    const match = matchQuoteByIdentifiers(
      {
        quoteId: 'ghost-id',
        serviceType: 'LOMBARD_BTC_TO_BTCB',
        aggregatorId: 'lombard'
      },
      [markr123, debridge456]
    )

    expect(match).toBeNull()
  })

  it('returns null for an empty allQuotes list', () => {
    const match = matchQuoteByIdentifiers(
      {
        quoteId: 'markr-123',
        serviceType: 'MARKR',
        aggregatorId: 'markr'
      },
      []
    )

    expect(match).toBeNull()
  })
})

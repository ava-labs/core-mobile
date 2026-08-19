import { normalizeLookupAddress, tokenLookupKey } from './tokenLookup'

const SOLANA_CAIP2_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'
const USDC_SOLANA_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

describe('normalizeLookupAddress', () => {
  it('lowercases an eip155 address', () => {
    expect(normalizeLookupAddress('eip155:43114', '0xAbCdEF1234')).toBe(
      '0xabcdef1234'
    )
  })

  it('lowercases an eip155 address regardless of namespace casing', () => {
    expect(normalizeLookupAddress('EIP155:43114', '0xAbCdEF1234')).toBe(
      '0xabcdef1234'
    )
  })

  it('keeps a solana base58 mint address verbatim', () => {
    expect(normalizeLookupAddress(SOLANA_CAIP2_ID, USDC_SOLANA_MINT)).toBe(
      USDC_SOLANA_MINT
    )
  })
})

describe('tokenLookupKey', () => {
  it('lowercases both the caip2Id and address for an eip155 pair', () => {
    expect(tokenLookupKey('EIP155:43114', '0xAbCdEF1234')).toBe(
      'eip155:43114-0xabcdef1234'
    )
  })

  it('keeps a solana caip2Id and base58 address verbatim', () => {
    expect(tokenLookupKey(SOLANA_CAIP2_ID, USDC_SOLANA_MINT)).toBe(
      `${SOLANA_CAIP2_ID}-${USDC_SOLANA_MINT}`
    )
  })

  it('produces the same key for checksummed and lowercase eip155 addresses', () => {
    expect(tokenLookupKey('eip155:1', '0xAbCd')).toBe(
      tokenLookupKey('eip155:1', '0xabcd')
    )
  })
})

import type { Quote } from '../types'
import { extractBridgeFee, getNativeBridgeFee } from './bridgeFee'

const makeQuote = (fees: Quote['fees']): Quote =>
  ({
    sourceChain: { chainId: 'eip155:43114' },
    fees
  } as unknown as Quote)

const makeFee = ({
  type,
  tokenType,
  chainId,
  amount
}: {
  type: 'bridge' | 'protocol' | 'network'
  tokenType: 'native' | 'erc20'
  chainId: string
  amount: bigint
}): Quote['fees'][number] =>
  ({
    type,
    token: { type: tokenType },
    chainId,
    amount
  } as Quote['fees'][number])

const SOURCE_CHAIN = 'eip155:43114'

describe('extractBridgeFee', () => {
  it('returns 0n when fees array is empty', () => {
    const quote = makeQuote([])
    expect(extractBridgeFee(quote)).toBe(0n)
  })

  it('returns 0n when no bridge or protocol fees exist', () => {
    const quote = makeQuote([
      makeFee({
        type: 'network',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 100n
      })
    ])
    expect(extractBridgeFee(quote)).toBe(0n)
  })

  it('excludes bridge fees with non-native tokens', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'erc20',
        chainId: SOURCE_CHAIN,
        amount: 100n
      })
    ])
    expect(extractBridgeFee(quote)).toBe(0n)
  })

  it('excludes bridge fees from a different chain', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: 'eip155:1',
        amount: 100n
      })
    ])
    expect(extractBridgeFee(quote)).toBe(0n)
  })

  it('includes bridge fees matching source chain and native token', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 100n
      })
    ])
    expect(extractBridgeFee(quote)).toBe(100n)
  })

  it('excludes protocol fees', () => {
    const quote = makeQuote([
      makeFee({
        type: 'protocol',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 200n
      })
    ])
    expect(extractBridgeFee(quote)).toBe(0n)
  })

  it('sums multiple bridge fees', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 100n
      }),
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 200n
      }),
      makeFee({
        type: 'network',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 50n // excluded
      })
    ])
    expect(extractBridgeFee(quote)).toBe(300n)
  })
})

describe('getNativeBridgeFee', () => {
  it('returns 0n when not native', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 1000n
      })
    ])
    expect(getNativeBridgeFee(false, quote, 2000)).toBe(0n)
  })

  it('returns 0n when quote is null', () => {
    expect(getNativeBridgeFee(true, null, 2000)).toBe(0n)
  })

  it('returns bridge fee with no safety buffer when safetyBps is 0', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 1000n
      })
    ])
    expect(getNativeBridgeFee(true, quote, 0)).toBe(1000n)
  })

  it('applies additive safety buffer correctly (2000 bps = +20%)', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 1000n
      })
    ])
    // 1000 * (10000 + 2000) / 10000 = 1200
    expect(getNativeBridgeFee(true, quote, 2000)).toBe(1200n)
  })

  it('applies 5000 bps safety buffer (+50%)', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 1000n
      })
    ])
    // 1000 * (10000 + 5000) / 10000 = 1500
    expect(getNativeBridgeFee(true, quote, 5000)).toBe(1500n)
  })
})

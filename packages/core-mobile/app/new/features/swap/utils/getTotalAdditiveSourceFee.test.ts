import { TokenType } from '@avalabs/vm-module-types'
import type { LocalTokenWithBalance } from 'store/balance'
import type { Quote } from '../types'
import {
  getTotalAdditiveSourceFee,
  getTotalAdditiveNativeFee
} from './getTotalAdditiveSourceFee'

const makeQuote = (fees: Quote['fees']): Quote =>
  ({
    sourceChain: { chainId: 'eip155:43114' },
    fees
  } as unknown as Quote)

const makeFee = ({
  type,
  fundingModel = 'additive',
  tokenType,
  tokenAddress,
  chainId,
  amount
}: {
  type: 'bridge' | 'protocol' | 'network' | 'partner'
  fundingModel?: 'additive' | 'included'
  tokenType: 'native' | 'erc20' | 'spl'
  tokenAddress?: string
  chainId: string
  amount: bigint
}): Quote['fees'][number] =>
  ({
    type,
    fundingModel,
    token: tokenAddress
      ? { type: tokenType, address: tokenAddress }
      : { type: tokenType },
    chainId,
    amount
  } as Quote['fees'][number])

const SOURCE_CHAIN = 'eip155:43114'

const makeErc20Token = (address: string): LocalTokenWithBalance =>
  ({
    type: TokenType.ERC20,
    address,
    decimals: 6,
    symbol: 'USDC',
    balance: 1000n
  } as unknown as LocalTokenWithBalance)

const makeSplToken = (address: string): LocalTokenWithBalance =>
  ({
    type: TokenType.SPL,
    address,
    decimals: 6,
    symbol: 'USDC',
    balance: 1000n
  } as unknown as LocalTokenWithBalance)

const makeNativeToken = (): LocalTokenWithBalance =>
  ({
    type: TokenType.NATIVE,
    decimals: 18,
    symbol: 'AVAX',
    balance: 1000n
  } as unknown as LocalTokenWithBalance)

// ---------------------------------------------------------------------------

describe('getTotalAdditiveSourceFee', () => {
  it('returns zeros when fromToken is undefined', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 500n
      })
    ])
    expect(getTotalAdditiveSourceFee(undefined, quote, 4000)).toEqual({
      buffered: 0n,
      raw: 0n
    })
  })

  it('returns zeros when quote is null', () => {
    expect(getTotalAdditiveSourceFee(makeNativeToken(), null, 4000)).toEqual({
      buffered: 0n,
      raw: 0n
    })
  })

  it('returns zeros when fees array is empty', () => {
    expect(
      getTotalAdditiveSourceFee(makeNativeToken(), makeQuote([]), 4000)
    ).toEqual({ buffered: 0n, raw: 0n })
  })

  // -------------------------------------------------------------------------
  // Token type mismatch — cross-type exclusions
  // -------------------------------------------------------------------------

  it('excludes ERC20 fee when source token is native', () => {
    const quote = makeQuote([
      makeFee({
        type: 'protocol',
        tokenType: 'erc20',
        tokenAddress: '0xabc',
        chainId: SOURCE_CHAIN,
        amount: 1000n
      })
    ])
    const result = getTotalAdditiveSourceFee(makeNativeToken(), quote, 4000)
    expect(result.buffered).toBe(0n)
  })

  it('excludes SPL fee when source token is native', () => {
    const quote = makeQuote([
      makeFee({
        type: 'protocol',
        tokenType: 'spl',
        tokenAddress: 'mintAddr123',
        chainId: SOURCE_CHAIN,
        amount: 1000n
      })
    ])
    const result = getTotalAdditiveSourceFee(makeNativeToken(), quote, 4000)
    expect(result.buffered).toBe(0n)
  })

  it('excludes native fee when source token is ERC20', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 1000n
      })
    ])
    const result = getTotalAdditiveSourceFee(
      makeErc20Token('0xabc'),
      quote,
      4000
    )
    expect(result.buffered).toBe(0n)
  })

  it('excludes SPL fee when source token is ERC20', () => {
    const quote = makeQuote([
      makeFee({
        type: 'protocol',
        tokenType: 'spl',
        tokenAddress: '0xabc',
        chainId: SOURCE_CHAIN,
        amount: 1000n
      })
    ])
    const result = getTotalAdditiveSourceFee(
      makeErc20Token('0xabc'),
      quote,
      4000
    )
    expect(result.buffered).toBe(0n)
  })

  it('excludes native fee when source token is SPL', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 1000n
      })
    ])
    const result = getTotalAdditiveSourceFee(
      makeSplToken('mintAddr123'),
      quote,
      4000
    )
    expect(result.buffered).toBe(0n)
  })

  it('excludes ERC20 fee when source token is SPL', () => {
    const quote = makeQuote([
      makeFee({
        type: 'protocol',
        tokenType: 'erc20',
        tokenAddress: 'mintAddr123',
        chainId: SOURCE_CHAIN,
        amount: 1000n
      })
    ])
    const result = getTotalAdditiveSourceFee(
      makeSplToken('mintAddr123'),
      quote,
      4000
    )
    expect(result.buffered).toBe(0n)
  })

  // -------------------------------------------------------------------------
  // Native token — additive fees
  // -------------------------------------------------------------------------

  it('applies safety buffer to native additive fee (4000 bps = +40%)', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 1000n
      })
    ])
    // raw = 1000, total = 1000 * 14000 / 10000 = 1400
    const result = getTotalAdditiveSourceFee(makeNativeToken(), quote, 4000)
    expect(result.raw).toBe(1000n)
    expect(result.buffered).toBe(1400n)
  })

  it('applies zero buffer when safetyBps is 0', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 1000n
      })
    ])
    const result = getTotalAdditiveSourceFee(makeNativeToken(), quote, 0)
    expect(result.raw).toBe(1000n)
    expect(result.buffered).toBe(1000n)
  })

  it('excludes native fee with fundingModel === included', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        fundingModel: 'included',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 1000n
      })
    ])
    const result = getTotalAdditiveSourceFee(makeNativeToken(), quote, 4000)
    expect(result.buffered).toBe(0n)
  })

  it('excludes native fee from a different chain', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: 'eip155:1',
        amount: 1000n
      })
    ])
    const result = getTotalAdditiveSourceFee(makeNativeToken(), quote, 4000)
    expect(result.buffered).toBe(0n)
  })

  it('sums multiple native additive fees', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 600n
      }),
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 400n
      })
    ])
    // raw = 1000, total = 1000 * 14000 / 10000 = 1400
    const result = getTotalAdditiveSourceFee(makeNativeToken(), quote, 4000)
    expect(result.raw).toBe(1000n)
    expect(result.buffered).toBe(1400n)
  })

  it('sums bridge and protocol native additive fees with uniform buffer', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 1000n
      }),
      makeFee({
        type: 'protocol',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 500n
      })
    ])
    // raw = 1500, total = 1500 * 14000 / 10000 = 2100
    const result = getTotalAdditiveSourceFee(makeNativeToken(), quote, 4000)
    expect(result.raw).toBe(1500n)
    expect(result.buffered).toBe(2100n)
  })

  // -------------------------------------------------------------------------
  // ERC20 token
  // -------------------------------------------------------------------------

  it('returns zeros for ERC20 when no additive fees match the token address', () => {
    const quote = makeQuote([
      makeFee({
        type: 'protocol',
        tokenType: 'erc20',
        tokenAddress: '0xother',
        chainId: SOURCE_CHAIN,
        amount: 300n
      })
    ])
    const result = getTotalAdditiveSourceFee(
      makeErc20Token('0xabc'),
      quote,
      4000
    )
    expect(result.buffered).toBe(0n)
  })

  it('matches ERC20 fee by address (case-insensitive)', () => {
    const quote = makeQuote([
      makeFee({
        type: 'protocol',
        tokenType: 'erc20',
        tokenAddress: '0xABC',
        chainId: SOURCE_CHAIN,
        amount: 1000n
      })
    ])
    // raw = 1000, total = 1000 * 14000 / 10000 = 1400
    const result = getTotalAdditiveSourceFee(
      makeErc20Token('0xabc'),
      quote,
      4000
    )
    expect(result.raw).toBe(1000n)
    expect(result.buffered).toBe(1400n)
  })

  it('applies safety buffer to ERC20 bridge fee', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'erc20',
        tokenAddress: '0xabc',
        chainId: SOURCE_CHAIN,
        amount: 1000n
      })
    ])
    // raw = 1000, total = 1000 * 14000 / 10000 = 1400
    const result = getTotalAdditiveSourceFee(
      makeErc20Token('0xabc'),
      quote,
      4000
    )
    expect(result.raw).toBe(1000n)
    expect(result.buffered).toBe(1400n)
  })

  it('sums multiple ERC20 additive fees', () => {
    const quote = makeQuote([
      makeFee({
        type: 'protocol',
        tokenType: 'erc20',
        tokenAddress: '0xabc',
        chainId: SOURCE_CHAIN,
        amount: 100n
      }),
      makeFee({
        type: 'partner',
        tokenType: 'erc20',
        tokenAddress: '0xabc',
        chainId: SOURCE_CHAIN,
        amount: 50n
      }),
      makeFee({
        type: 'protocol',
        tokenType: 'erc20',
        tokenAddress: '0xother',
        chainId: SOURCE_CHAIN,
        amount: 999n // different token — excluded
      })
    ])
    // raw = 150, total = 150 * 14000 / 10000 = 210
    const result = getTotalAdditiveSourceFee(
      makeErc20Token('0xabc'),
      quote,
      4000
    )
    expect(result.raw).toBe(150n)
    expect(result.buffered).toBe(210n)
  })

  it('excludes ERC20 fee with fundingModel === included', () => {
    const quote = makeQuote([
      makeFee({
        type: 'protocol',
        fundingModel: 'included',
        tokenType: 'erc20',
        tokenAddress: '0xabc',
        chainId: SOURCE_CHAIN,
        amount: 300n
      })
    ])
    const result = getTotalAdditiveSourceFee(
      makeErc20Token('0xabc'),
      quote,
      4000
    )
    expect(result.buffered).toBe(0n)
  })

  it('excludes ERC20 fee from a different chain', () => {
    const quote = makeQuote([
      makeFee({
        type: 'protocol',
        tokenType: 'erc20',
        tokenAddress: '0xabc',
        chainId: 'eip155:1',
        amount: 300n
      })
    ])
    const result = getTotalAdditiveSourceFee(
      makeErc20Token('0xabc'),
      quote,
      4000
    )
    expect(result.buffered).toBe(0n)
  })

  // -------------------------------------------------------------------------
  // SPL token
  // -------------------------------------------------------------------------

  it('matches SPL fee by exact mint address', () => {
    const quote = makeQuote([
      makeFee({
        type: 'protocol',
        tokenType: 'spl',
        tokenAddress: 'mintAddr123',
        chainId: SOURCE_CHAIN,
        amount: 1000n
      })
    ])
    // raw = 1000, total = 1000 * 14000 / 10000 = 1400
    const result = getTotalAdditiveSourceFee(
      makeSplToken('mintAddr123'),
      quote,
      4000
    )
    expect(result.raw).toBe(1000n)
    expect(result.buffered).toBe(1400n)
  })

  it('returns zeros when SPL mint address does not match', () => {
    const quote = makeQuote([
      makeFee({
        type: 'protocol',
        tokenType: 'spl',
        tokenAddress: 'mintAddrOther',
        chainId: SOURCE_CHAIN,
        amount: 1000n
      })
    ])
    const result = getTotalAdditiveSourceFee(
      makeSplToken('mintAddr123'),
      quote,
      4000
    )
    expect(result.buffered).toBe(0n)
  })

  describe('negative safetyBps clamping', () => {
    it('clamps negative safetyBps to 0 — buffered equals raw', () => {
      const quote = makeQuote([
        makeFee({
          type: 'bridge',
          tokenType: 'native',
          chainId: SOURCE_CHAIN,
          amount: 1000n
        })
      ])
      const result = getTotalAdditiveSourceFee(makeNativeToken(), quote, -2000)
      expect(result.raw).toBe(1000n)
      expect(result.buffered).toBe(1000n)
    })

    it('clamps safetyBps of -10001 to 0 — no negative buffered fee', () => {
      const quote = makeQuote([
        makeFee({
          type: 'bridge',
          tokenType: 'native',
          chainId: SOURCE_CHAIN,
          amount: 500n
        })
      ])
      const result = getTotalAdditiveSourceFee(makeNativeToken(), quote, -10001)
      expect(result.buffered).toBe(500n)
    })
  })
})

describe('getTotalAdditiveNativeFee', () => {
  it('returns zeros when fromToken is undefined', () => {
    expect(getTotalAdditiveNativeFee(undefined, makeQuote([]), 4000)).toEqual({
      buffered: 0n,
      raw: 0n
    })
  })

  it('returns zeros when quote is null', () => {
    expect(
      getTotalAdditiveNativeFee(makeErc20Token('0xabc'), null, 4000)
    ).toEqual({ buffered: 0n, raw: 0n })
  })

  it('returns zeros for native source tokens (already covered by getTotalAdditiveSourceFee)', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 1000n
      })
    ])
    const result = getTotalAdditiveNativeFee(makeNativeToken(), quote, 4000)
    expect(result.raw).toBe(0n)
    expect(result.buffered).toBe(0n)
  })

  it('sums native additive fees for ERC-20 source token', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 500n
      }),
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 300n
      })
    ])
    const result = getTotalAdditiveNativeFee(
      makeErc20Token('0xabc'),
      quote,
      4000
    )
    // raw = 800, buffered = 800 * 14000 / 10000 = 1120
    expect(result.raw).toBe(800n)
    expect(result.buffered).toBe(1120n)
  })

  it('ignores non-additive fees', () => {
    const quote = makeQuote([
      makeFee({
        type: 'protocol',
        fundingModel: 'included',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 999n
      }),
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 200n
      })
    ])
    const result = getTotalAdditiveNativeFee(makeErc20Token('0xabc'), quote, 0)
    expect(result.raw).toBe(200n)
  })

  it('ignores fees from a different chain', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: 'eip155:1',
        amount: 1000n
      })
    ])
    const result = getTotalAdditiveNativeFee(
      makeErc20Token('0xabc'),
      quote,
      4000
    )
    expect(result.raw).toBe(0n)
    expect(result.buffered).toBe(0n)
  })

  it('ignores non-native fee tokens', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'erc20',
        tokenAddress: '0xfee',
        chainId: SOURCE_CHAIN,
        amount: 1000n
      })
    ])
    const result = getTotalAdditiveNativeFee(
      makeErc20Token('0xabc'),
      quote,
      4000
    )
    expect(result.raw).toBe(0n)
  })

  it('applies safetyBps buffer correctly', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 1000n
      })
    ])
    // buffered = 1000 * 15000 / 10000 = 1500
    const result = getTotalAdditiveNativeFee(
      makeErc20Token('0xabc'),
      quote,
      5000
    )
    expect(result.raw).toBe(1000n)
    expect(result.buffered).toBe(1500n)
  })

  describe('negative safetyBps clamping', () => {
    it('clamps negative safetyBps to 0 — buffered equals raw', () => {
      const quote = makeQuote([
        makeFee({
          type: 'bridge',
          tokenType: 'native',
          chainId: SOURCE_CHAIN,
          amount: 800n
        })
      ])
      const result = getTotalAdditiveNativeFee(
        makeErc20Token('0xtoken'),
        quote,
        -3000
      )
      expect(result.raw).toBe(800n)
      expect(result.buffered).toBe(800n)
    })
  })
})

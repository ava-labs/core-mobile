import { TokenType } from '@avalabs/vm-module-types'
import type { LocalTokenWithBalance } from 'store/balance'
import type { Quote } from '../types'
import {
  extractBridgeFee,
  getNativeBridgeFee,
  extractSourceTokenAdditiveFee,
  getSourceTokenAdditiveFee
} from './bridgeFee'

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
describe('extractBridgeFee', () => {
  it('returns 0n when fees array is empty', () => {
    expect(extractBridgeFee(makeQuote([]))).toBe(0n)
  })

  it('returns 0n when only a network fee is present', () => {
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

  it('excludes bridge fees with fundingModel === included', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        fundingModel: 'included',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 100n
      })
    ])
    expect(extractBridgeFee(quote)).toBe(0n)
  })

  it('includes bridge fees matching source chain, native token, and additive funding', () => {
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
        amount: 50n
      })
    ])
    expect(extractBridgeFee(quote)).toBe(300n)
  })
})

// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
describe('extractSourceTokenAdditiveFee', () => {
  it('returns 0n for native tokens', () => {
    const quote = makeQuote([
      makeFee({
        type: 'protocol',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 500n
      })
    ])
    expect(extractSourceTokenAdditiveFee(quote, makeNativeToken())).toBe(0n)
  })

  it('returns 0n when no additive fees exist', () => {
    const quote = makeQuote([])
    expect(extractSourceTokenAdditiveFee(quote, makeErc20Token('0xabc'))).toBe(
      0n
    )
  })

  it('returns 0n when additive fee is a bridge fee (handled separately)', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'erc20',
        tokenAddress: '0xabc',
        chainId: SOURCE_CHAIN,
        amount: 300n
      })
    ])
    expect(extractSourceTokenAdditiveFee(quote, makeErc20Token('0xabc'))).toBe(
      0n
    )
  })

  it('returns 0n for included fees', () => {
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
    expect(extractSourceTokenAdditiveFee(quote, makeErc20Token('0xabc'))).toBe(
      0n
    )
  })

  it('returns 0n when ERC20 address does not match', () => {
    const quote = makeQuote([
      makeFee({
        type: 'protocol',
        tokenType: 'erc20',
        tokenAddress: '0xdifferent',
        chainId: SOURCE_CHAIN,
        amount: 300n
      })
    ])
    expect(extractSourceTokenAdditiveFee(quote, makeErc20Token('0xabc'))).toBe(
      0n
    )
  })

  it('returns 0n for fees on a different chain', () => {
    const quote = makeQuote([
      makeFee({
        type: 'protocol',
        tokenType: 'erc20',
        tokenAddress: '0xabc',
        chainId: 'eip155:1',
        amount: 300n
      })
    ])
    expect(extractSourceTokenAdditiveFee(quote, makeErc20Token('0xabc'))).toBe(
      0n
    )
  })

  it('matches ERC20 fee by address (case-insensitive)', () => {
    const quote = makeQuote([
      makeFee({
        type: 'protocol',
        tokenType: 'erc20',
        tokenAddress: '0xABC',
        chainId: SOURCE_CHAIN,
        amount: 300n
      })
    ])
    expect(extractSourceTokenAdditiveFee(quote, makeErc20Token('0xabc'))).toBe(
      300n
    )
  })

  it('sums multiple matching ERC20 additive fees', () => {
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
    expect(extractSourceTokenAdditiveFee(quote, makeErc20Token('0xabc'))).toBe(
      150n
    )
  })

  it('matches SPL fee by address', () => {
    const quote = makeQuote([
      makeFee({
        type: 'protocol',
        tokenType: 'spl',
        tokenAddress: 'mintAddr123',
        chainId: SOURCE_CHAIN,
        amount: 200n
      })
    ])
    expect(
      extractSourceTokenAdditiveFee(quote, makeSplToken('mintAddr123'))
    ).toBe(200n)
  })

  it('returns 0n when SPL address does not match', () => {
    const quote = makeQuote([
      makeFee({
        type: 'protocol',
        tokenType: 'spl',
        tokenAddress: 'mintAddrOther',
        chainId: SOURCE_CHAIN,
        amount: 200n
      })
    ])
    expect(
      extractSourceTokenAdditiveFee(quote, makeSplToken('mintAddr123'))
    ).toBe(0n)
  })
})

// ---------------------------------------------------------------------------
describe('getSourceTokenAdditiveFee', () => {
  it('returns 0n when fromToken is undefined', () => {
    const quote = makeQuote([
      makeFee({
        type: 'protocol',
        tokenType: 'erc20',
        tokenAddress: '0xabc',
        chainId: SOURCE_CHAIN,
        amount: 500n
      })
    ])
    expect(getSourceTokenAdditiveFee(undefined, quote, 2000)).toBe(0n)
  })

  it('returns 0n when quote is null', () => {
    expect(getSourceTokenAdditiveFee(makeErc20Token('0xabc'), null, 2000)).toBe(
      0n
    )
  })

  it('applies safety buffer (2000 bps = +20%)', () => {
    const quote = makeQuote([
      makeFee({
        type: 'protocol',
        tokenType: 'erc20',
        tokenAddress: '0xabc',
        chainId: SOURCE_CHAIN,
        amount: 1000n
      })
    ])
    // 1000 * (10000 + 2000) / 10000 = 1200
    expect(
      getSourceTokenAdditiveFee(makeErc20Token('0xabc'), quote, 2000)
    ).toBe(1200n)
  })

  it('returns 0n for native tokens even with additive protocol fees', () => {
    const quote = makeQuote([
      makeFee({
        type: 'protocol',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 500n
      })
    ])
    expect(getSourceTokenAdditiveFee(makeNativeToken(), quote, 2000)).toBe(0n)
  })
})

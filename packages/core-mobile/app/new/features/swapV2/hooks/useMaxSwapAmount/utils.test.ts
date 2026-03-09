import { TokenType } from '@avalabs/vm-module-types'
import type { NetworkFees } from '@avalabs/vm-module-types'
import type { LocalTokenWithBalance } from 'store/balance'
import type { Quote } from '../../types'
import {
  buildFeeOptions,
  computeMaxAmount,
  extractBridgeFee,
  getNativeBridgeFee
} from './utils'

const makeToken = (
  balance: bigint,
  type: TokenType = TokenType.NATIVE
): LocalTokenWithBalance =>
  ({
    balance,
    type
  } as LocalTokenWithBalance)

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

describe('buildFeeOptions', () => {
  it('returns only feeUnitsMarginBps when networkFee is undefined', () => {
    const result = buildFeeOptions(2000, undefined)
    expect(result).toEqual({ feeUnitsMarginBps: 2000 })
    expect(result.overrides).toBeUndefined()
  })

  it('returns without overrides when maxPriorityFeePerGas is undefined', () => {
    const networkFee = {
      high: { maxFeePerGas: 100n, maxPriorityFeePerGas: undefined }
    } as unknown as NetworkFees

    const result = buildFeeOptions(2000, networkFee)
    expect(result).toEqual({ feeUnitsMarginBps: 2000 })
    expect(result.overrides).toBeUndefined()
  })

  it('returns overrides when maxPriorityFeePerGas is defined', () => {
    const networkFee = {
      high: { maxFeePerGas: 100n, maxPriorityFeePerGas: 10n }
    } as unknown as NetworkFees

    const result = buildFeeOptions(2000, networkFee)
    expect(result).toEqual({
      feeUnitsMarginBps: 2000,
      overrides: {
        feeRateTier: 'fast',
        maxFeePerGas: 100n,
        maxPriorityFeePerGas: 10n
      }
    })
  })
})

describe('computeMaxAmount', () => {
  it('returns undefined when fromToken is undefined', () => {
    const result = computeMaxAmount({
      fromToken: undefined,
      isNative: true,
      bufferedGas: 1000n,
      bridgeFee: 100n,
      hasEstimationError: false
    })
    expect(result).toBeUndefined()
  })

  it('returns full balance for non-native tokens', () => {
    const token = makeToken(5000n, TokenType.ERC20)
    const result = computeMaxAmount({
      fromToken: token,
      isNative: false,
      bufferedGas: 1000n,
      bridgeFee: 100n,
      hasEstimationError: false
    })
    expect(result).toBe(5000n)
  })

  it('returns full balance when hasEstimationError is true (native)', () => {
    const token = makeToken(5000n)
    const result = computeMaxAmount({
      fromToken: token,
      isNative: true,
      bufferedGas: 1000n,
      bridgeFee: 100n,
      hasEstimationError: true
    })
    expect(result).toBe(5000n)
  })

  it('returns undefined when bufferedGas is undefined (native, loading)', () => {
    const token = makeToken(5000n)
    const result = computeMaxAmount({
      fromToken: token,
      isNative: true,
      bufferedGas: undefined,
      bridgeFee: 100n,
      hasEstimationError: false
    })
    expect(result).toBeUndefined()
  })

  it('returns balance minus gas and bridge fee for native tokens', () => {
    const token = makeToken(5000n)
    const result = computeMaxAmount({
      fromToken: token,
      isNative: true,
      bufferedGas: 1000n,
      bridgeFee: 200n,
      hasEstimationError: false
    })
    expect(result).toBe(3800n)
  })

  it('returns 0n when fees exceed balance', () => {
    const token = makeToken(500n)
    const result = computeMaxAmount({
      fromToken: token,
      isNative: true,
      bufferedGas: 400n,
      bridgeFee: 200n,
      hasEstimationError: false
    })
    expect(result).toBe(0n)
  })
})

describe('extractBridgeFee', () => {
  const SOURCE_CHAIN = 'eip155:43114'

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

  it('includes protocol fees matching source chain and native token', () => {
    const quote = makeQuote([
      makeFee({
        type: 'protocol',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 200n
      })
    ])
    expect(extractBridgeFee(quote)).toBe(200n)
  })

  it('sums multiple matching fees', () => {
    const quote = makeQuote([
      makeFee({
        type: 'bridge',
        tokenType: 'native',
        chainId: SOURCE_CHAIN,
        amount: 100n
      }),
      makeFee({
        type: 'protocol',
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
  const SOURCE_CHAIN = 'eip155:43114'

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

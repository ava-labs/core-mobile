import { TokenType } from '@avalabs/vm-module-types'
import type { NetworkFees } from '@avalabs/vm-module-types'
import type { LocalTokenWithBalance } from 'store/balance'
import { buildFeeOptions, computeMaxAmount } from './utils'

const makeToken = (
  balance: bigint,
  type: TokenType = TokenType.NATIVE
): LocalTokenWithBalance =>
  ({
    balance,
    type
  } as LocalTokenWithBalance)

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

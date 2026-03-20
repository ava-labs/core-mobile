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
    expect(result.feeUnitsMarginBps).toBe(2000)
    expect(result.overrides?.feeRateTier).toBe('fast')
    expect(result.overrides?.maxFeePerGas).toBe(100n)
    expect(result.overrides?.maxPriorityFeePerGas).toBe(10n)
  })
})

describe('computeMaxAmount', () => {
  it('returns undefined when fromToken is undefined', () => {
    const result = computeMaxAmount({
      fromToken: undefined,
      isNative: true,
      bufferedGas: 1000n,
      bridgeFee: 100n,
      additiveFee: 0n,
      hasEstimationError: false
    })
    expect(result).toBeUndefined()
  })

  // -------------------------------------------------------------------------
  // Native token tests
  // -------------------------------------------------------------------------

  it('returns full balance for native token when hasEstimationError is true', () => {
    const token = makeToken(5000n)
    const result = computeMaxAmount({
      fromToken: token,
      isNative: true,
      bufferedGas: 1000n,
      bridgeFee: 100n,
      additiveFee: 0n,
      hasEstimationError: true
    })
    expect(result).toBe(5000n)
  })

  it('returns undefined for native token when bufferedGas is undefined (loading)', () => {
    const token = makeToken(5000n)
    const result = computeMaxAmount({
      fromToken: token,
      isNative: true,
      bufferedGas: undefined,
      bridgeFee: 100n,
      additiveFee: 0n,
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
      additiveFee: 0n,
      hasEstimationError: false
    })
    expect(result).toBe(3800n)
  })

  it('returns undefined for native when fees exceed balance', () => {
    const token = makeToken(500n)
    const result = computeMaxAmount({
      fromToken: token,
      isNative: true,
      bufferedGas: 400n,
      bridgeFee: 200n,
      additiveFee: 0n,
      hasEstimationError: false
    })
    expect(result).toBeUndefined()
  })

  // -------------------------------------------------------------------------
  // ERC20/SPL token tests
  // -------------------------------------------------------------------------

  it('returns full balance for ERC20 when additiveFee is 0', () => {
    const token = makeToken(5000n, TokenType.ERC20)
    const result = computeMaxAmount({
      fromToken: token,
      isNative: false,
      bufferedGas: 1000n,
      bridgeFee: 0n,
      additiveFee: 0n,
      hasEstimationError: false
    })
    expect(result).toBe(5000n)
  })

  it('deducts additiveFee from ERC20 balance', () => {
    const token = makeToken(5000n, TokenType.ERC20)
    const result = computeMaxAmount({
      fromToken: token,
      isNative: false,
      bufferedGas: 1000n,
      bridgeFee: 0n,
      additiveFee: 300n,
      hasEstimationError: false
    })
    expect(result).toBe(4700n)
  })

  it('returns undefined for ERC20 when additiveFee exceeds balance', () => {
    const token = makeToken(200n, TokenType.ERC20)
    const result = computeMaxAmount({
      fromToken: token,
      isNative: false,
      bufferedGas: 0n,
      bridgeFee: 0n,
      additiveFee: 500n,
      hasEstimationError: false
    })
    expect(result).toBeUndefined()
  })

  it('deducts additiveFee from SPL balance', () => {
    const token = makeToken(10000n, TokenType.SPL)
    const result = computeMaxAmount({
      fromToken: token,
      isNative: false,
      bufferedGas: 0n,
      bridgeFee: 0n,
      additiveFee: 1000n,
      hasEstimationError: false
    })
    expect(result).toBe(9000n)
  })

  it('ignores hasEstimationError for ERC20 (gas paid in native asset)', () => {
    const token = makeToken(5000n, TokenType.ERC20)
    const result = computeMaxAmount({
      fromToken: token,
      isNative: false,
      bufferedGas: undefined,
      bridgeFee: 0n,
      additiveFee: 200n,
      hasEstimationError: true
    })
    // ERC20 path always runs regardless of estimation error
    expect(result).toBe(4800n)
  })
})

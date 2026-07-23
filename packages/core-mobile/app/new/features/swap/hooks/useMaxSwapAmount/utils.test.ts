import { TokenType } from '@avalabs/vm-module-types'
import type { NetworkFees } from '@avalabs/vm-module-types'
import type { LocalTokenWithBalance } from 'store/balance'
import {
  buildFeeOptions,
  computeIsMaxLoading,
  computeMaxAmount,
  getPreQuoteAmount,
  getRouteAdditiveBps,
  resolveAdditiveFeeForMax,
  RouteAdditiveBpsConfig
} from './utils'

const makeToken = (
  balance: bigint,
  type: TokenType = TokenType.NATIVE
): LocalTokenWithBalance =>
  ({
    balance,
    type
  } as LocalTokenWithBalance)

// P/X-chain AVAX: `balance` includes staked/locked funds, `available` is the
// swappable (unlocked/unstaked) portion.
const makeStakedToken = (
  balance: bigint,
  available: bigint
): LocalTokenWithBalance =>
  ({
    balance,
    available,
    type: TokenType.NATIVE
  } as unknown as LocalTokenWithBalance)

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
      additiveFee: 0n,
      hasEstimationError: false
    })
    expect(result).toBeUndefined()
  })

  it('uses spendableBalance instead of the displayed balance when provided (CP-13903)', () => {
    const token = makeToken(5000n)
    const result = computeMaxAmount({
      fromToken: token,
      isNative: true,
      bufferedGas: 1000n,
      additiveFee: 0n,
      hasEstimationError: false,
      spendableBalance: 3000n
    })
    expect(result).toBe(2000n)
  })

  it('uses spendableBalance for the estimation-error fallback too (CP-13903)', () => {
    const token = makeToken(5000n)
    const result = computeMaxAmount({
      fromToken: token,
      isNative: true,
      bufferedGas: undefined,
      additiveFee: 0n,
      hasEstimationError: true,
      spendableBalance: 3000n
    })
    expect(result).toBe(3000n)
  })

  it('returns balance minus gas for native token with no additive fees', () => {
    const token = makeToken(5000n)
    const result = computeMaxAmount({
      fromToken: token,
      isNative: true,
      bufferedGas: 1000n,
      additiveFee: 0n,
      hasEstimationError: false
    })
    expect(result).toBe(4000n)
  })

  it('returns balance minus gas and additive fee for native tokens', () => {
    const token = makeToken(5000n)
    const result = computeMaxAmount({
      fromToken: token,
      isNative: true,
      bufferedGas: 1000n,
      additiveFee: 200n,
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
      additiveFee: 200n,
      hasEstimationError: false
    })
    expect(result).toBeUndefined()
  })

  // -------------------------------------------------------------------------
  // P/X-chain staked-balance tests (CP-14788)
  // -------------------------------------------------------------------------

  it('caps native max at available (not full balance) for a P-chain token with staked funds', () => {
    // balance 10000 includes staked; only 3000 is available to swap
    const token = makeStakedToken(10000n, 3000n)
    const result = computeMaxAmount({
      fromToken: token,
      isNative: true,
      bufferedGas: 1000n,
      additiveFee: 0n,
      hasEstimationError: false
    })
    expect(result).toBe(2000n)
  })

  it('returns available (not full balance) for a P-chain token on estimation error', () => {
    const token = makeStakedToken(10000n, 3000n)
    const result = computeMaxAmount({
      fromToken: token,
      isNative: true,
      bufferedGas: 1000n,
      additiveFee: 0n,
      hasEstimationError: true
    })
    expect(result).toBe(3000n)
  })

  it('returns undefined for a P-chain token when fees exceed available', () => {
    const token = makeStakedToken(10000n, 500n)
    const result = computeMaxAmount({
      fromToken: token,
      isNative: true,
      bufferedGas: 400n,
      additiveFee: 200n,
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
      additiveFee: 200n,
      hasEstimationError: true
    })
    // ERC20 path always runs regardless of estimation error
    expect(result).toBe(4800n)
  })

  it('returns undefined for ERC20 when additiveFee is undefined (pre-quote loading)', () => {
    const token = makeToken(5000n, TokenType.ERC20)
    const result = computeMaxAmount({
      fromToken: token,
      isNative: false,
      bufferedGas: undefined,
      additiveFee: undefined,
      hasEstimationError: false
    })
    expect(result).toBeUndefined()
  })

  it('returns undefined for SPL when additiveFee is undefined (pre-quote loading)', () => {
    const token = makeToken(10000n, TokenType.SPL)
    const result = computeMaxAmount({
      fromToken: token,
      isNative: false,
      bufferedGas: undefined,
      additiveFee: undefined,
      hasEstimationError: false
    })
    expect(result).toBeUndefined()
  })
})

describe('getPreQuoteAmount', () => {
  it('returns undefined when minimumTransferAmount is undefined', () => {
    expect(getPreQuoteAmount(undefined, undefined)).toBeUndefined()
  })

  it('returns null when minimumTransferAmount is null', () => {
    expect(getPreQuoteAmount(null, undefined)).toBeNull()
  })

  it('returns minimumTransferAmount when fromToken is undefined', () => {
    expect(getPreQuoteAmount(100n, undefined)).toBe(100n)
  })

  it('returns minimumTransferAmount when half balance is smaller', () => {
    const token = makeToken(100n)
    expect(getPreQuoteAmount(100n, token)).toBe(100n)
  })

  it('returns half balance when it exceeds minimumTransferAmount', () => {
    const token = makeToken(1000n)
    expect(getPreQuoteAmount(100n, token)).toBe(500n)
  })

  it('uses half of available (not full balance) for a P-chain staked token', () => {
    // full balance 1000 would give 500, but only 200 is available → half is 100
    const token = makeStakedToken(1000n, 200n)
    expect(getPreQuoteAmount(50n, token)).toBe(100n)
  })
})

describe('resolveAdditiveFeeForMax', () => {
  it('returns 0n when pre-quote failed', () => {
    expect(resolveAdditiveFeeForMax(true, false, 500n)).toBe(0n)
  })

  it('returns undefined when pre-quote is not yet ready', () => {
    expect(resolveAdditiveFeeForMax(false, false, 500n)).toBeUndefined()
  })

  it('returns bufferedAdditiveFee when pre-quote is ready', () => {
    expect(resolveAdditiveFeeForMax(false, true, 500n)).toBe(500n)
  })

  it('returns 0n when failed even if isQuoteReady is true', () => {
    expect(resolveAdditiveFeeForMax(true, true, 500n)).toBe(0n)
  })
})

describe('getRouteAdditiveBps', () => {
  const config: RouteAdditiveBpsConfig = {
    default: 1500,
    evmToSolana: 5500,
    solanaToEvm: 500
  }

  // -------------------------------------------------------------------------
  // Missing chain IDs
  // -------------------------------------------------------------------------

  it('returns default when fromChainId is undefined', () => {
    expect(getRouteAdditiveBps(undefined, 'solana:mainnet', config)).toBe(1500)
  })

  it('returns default when toChainId is undefined', () => {
    expect(getRouteAdditiveBps('eip155:43114', undefined, config)).toBe(1500)
  })

  it('returns default when both chain IDs are undefined', () => {
    expect(getRouteAdditiveBps(undefined, undefined, config)).toBe(1500)
  })

  // -------------------------------------------------------------------------
  // EVM → Solana
  // -------------------------------------------------------------------------

  it('returns evmToSolana bps for eip155 → solana', () => {
    expect(getRouteAdditiveBps('eip155:43114', 'solana:mainnet', config)).toBe(
      5500
    )
  })

  it('returns evmToSolana bps for any eip155 chain → solana', () => {
    expect(getRouteAdditiveBps('eip155:1', 'solana:mainnet', config)).toBe(5500)
  })

  // -------------------------------------------------------------------------
  // Solana → EVM
  // -------------------------------------------------------------------------

  it('returns solanaToEvm bps for solana → eip155', () => {
    expect(getRouteAdditiveBps('solana:mainnet', 'eip155:43114', config)).toBe(
      500
    )
  })

  it('returns solanaToEvm bps for solana → any eip155 chain', () => {
    expect(getRouteAdditiveBps('solana:mainnet', 'eip155:1', config)).toBe(500)
  })

  // -------------------------------------------------------------------------
  // Default routes
  // -------------------------------------------------------------------------

  it('returns default for evm → evm', () => {
    expect(getRouteAdditiveBps('eip155:43114', 'eip155:1', config)).toBe(1500)
  })

  it('returns default for solana → solana', () => {
    expect(
      getRouteAdditiveBps('solana:mainnet', 'solana:mainnet', config)
    ).toBe(1500)
  })

  it('returns default for unknown → evm', () => {
    expect(getRouteAdditiveBps('bitcoin:mainnet', 'eip155:1', config)).toBe(
      1500
    )
  })

  it('returns default for evm → unknown', () => {
    expect(getRouteAdditiveBps('eip155:43114', 'bitcoin:mainnet', config)).toBe(
      1500
    )
  })

  it('returns default for unknown → unknown', () => {
    expect(
      getRouteAdditiveBps('bitcoin:mainnet', 'bitcoin:mainnet', config)
    ).toBe(1500)
  })
})

describe('computeIsMaxLoading', () => {
  const baseParams = {
    fromToken: makeToken(1_000_000n),
    isNative: true,
    bufferedGas: undefined as bigint | undefined,
    additiveFee: undefined as bigint | undefined,
    hasEstimationError: false,
    isSpendableBalanceRequired: false,
    spendableBalance: undefined as bigint | undefined,
    hasSpendableBalanceError: false
  }

  it('is false without a from token', () => {
    expect(computeIsMaxLoading({ ...baseParams, fromToken: undefined })).toBe(
      false
    )
  })

  it('is true while the X/P spendable balance is pending', () => {
    expect(
      computeIsMaxLoading({
        ...baseParams,
        isSpendableBalanceRequired: true,
        spendableBalance: undefined
      })
    ).toBe(true)
  })

  it('is false when the X/P spendable query settled in error (terminal — Max hides)', () => {
    expect(
      computeIsMaxLoading({
        ...baseParams,
        isSpendableBalanceRequired: true,
        spendableBalance: undefined,
        hasSpendableBalanceError: true
      })
    ).toBe(false)
  })

  it('is true for a native source while the gas estimate is pending', () => {
    expect(computeIsMaxLoading({ ...baseParams, bufferedGas: undefined })).toBe(
      true
    )
  })

  it('is false for a native source once the gas estimate arrives', () => {
    expect(computeIsMaxLoading({ ...baseParams, bufferedGas: 100n })).toBe(
      false
    )
  })

  it('is true for a non-native source while the additive fee is pending', () => {
    expect(
      computeIsMaxLoading({
        ...baseParams,
        isNative: false,
        additiveFee: undefined
      })
    ).toBe(true)
  })

  it('is false for a non-native source once the additive fee arrives', () => {
    expect(
      computeIsMaxLoading({ ...baseParams, isNative: false, additiveFee: 0n })
    ).toBe(false)
  })

  it('is false on estimation error — computeMaxAmount falls back to balance', () => {
    expect(
      computeIsMaxLoading({ ...baseParams, hasEstimationError: true })
    ).toBe(false)
  })

  it('spendable pending wins over an available gas estimate', () => {
    expect(
      computeIsMaxLoading({
        ...baseParams,
        bufferedGas: 100n,
        isSpendableBalanceRequired: true,
        spendableBalance: undefined
      })
    ).toBe(true)
  })
})

import { TokenType } from '@avalabs/vm-module-types'
import type { Network } from '@avalabs/core-chains-sdk'
import {
  EstimateNativeFeeError,
  InsufficientFundsError,
  ErrorCode,
  SdkError
} from '@avalabs/fusion-sdk'
import type { LocalTokenWithBalance } from 'store/balance'
import {
  validateNativeToken,
  validateNonNativeToken,
  deriveValidationAdditiveBps,
  getFeeEstimationError
} from './utils'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeNativeToken = (balance: bigint): LocalTokenWithBalance =>
  ({
    type: TokenType.NATIVE,
    decimals: 18,
    symbol: 'AVAX',
    balance
  } as unknown as LocalTokenWithBalance)

const makeErc20Token = (balance: bigint): LocalTokenWithBalance =>
  ({
    type: TokenType.ERC20,
    address: '0xusdc',
    decimals: 6,
    symbol: 'USDC',
    balance
  } as unknown as LocalTokenWithBalance)

// Native P/X-chain AVAX: `balance` includes staked/locked funds, `available` is
// the swappable portion (CP-14788).
const makeStakedNativeToken = (
  balance: bigint,
  available: bigint
): LocalTokenWithBalance =>
  ({
    type: TokenType.NATIVE,
    decimals: 18,
    symbol: 'AVAX',
    balance,
    available
  } as unknown as LocalTokenWithBalance)

const makeNetwork = (symbol: string, decimals: number): Network =>
  ({
    networkToken: { symbol, decimals }
  } as unknown as Network)

// ─── validateNativeToken ─────────────────────────────────────────────────────

describe('validateNativeToken', () => {
  const GAS = 100n
  const ADDITIVE = 50n

  describe('when token has no decimals', () => {
    it('returns undefined', () => {
      const token = {
        type: TokenType.NATIVE,
        symbol: 'AVAX',
        balance: 0n
      } as unknown as LocalTokenWithBalance
      expect(
        validateNativeToken({
          fromToken: token,
          amount: undefined,
          bufferedGasFee: GAS,
          bufferedAdditiveFee: ADDITIVE
        })
      ).toBeUndefined()
    })
  })

  describe('with no bridge fee (gas only)', () => {
    it('Case 1: returns networkFeeExceedsBalance when gas alone exceeds balance', () => {
      const error = validateNativeToken({
        fromToken: makeNativeToken(50n),
        amount: undefined,
        bufferedGasFee: GAS,
        bufferedAdditiveFee: 0n
      })
      expect(error?.message).toContain('Network fee exceeds your balance')
    })

    it('Case 3: returns amountExceedsBalanceAfterNetworkFee when gas + amount exceed balance', () => {
      const error = validateNativeToken({
        fromToken: makeNativeToken(110n), // covers gas (100) but not gas + amount (200)
        amount: 100n,
        bufferedGasFee: GAS,
        bufferedAdditiveFee: 0n
      })
      expect(error?.message).toContain('network fee')
    })

    it('returns undefined when balance covers fee + amount', () => {
      const error = validateNativeToken({
        fromToken: makeNativeToken(250n),
        amount: 100n,
        bufferedGasFee: GAS,
        bufferedAdditiveFee: 0n
      })
      expect(error).toBeUndefined()
    })
  })

  describe('P/X-chain staked balance (CP-14788)', () => {
    it('validates against available, not total balance (amount + fee exceeds available)', () => {
      // total balance 250 would cover amount(100) + gas(100), but only 150 is
      // available (rest staked), so amount + fee (200) exceeds available.
      const error = validateNativeToken({
        fromToken: makeStakedNativeToken(250n, 150n),
        amount: 100n,
        bufferedGasFee: GAS,
        bufferedAdditiveFee: 0n
      })
      expect(error?.message).toContain('network fee')
    })

    it('returns undefined when available covers fee + amount', () => {
      const error = validateNativeToken({
        fromToken: makeStakedNativeToken(10000n, 250n),
        amount: 100n,
        bufferedGasFee: GAS,
        bufferedAdditiveFee: 0n
      })
      expect(error).toBeUndefined()
    })
  })

  describe('with bridge fee (gas + additive)', () => {
    it('Case 2: returns feesExceedBalance when gas + bridge fees exceed balance', () => {
      const error = validateNativeToken({
        fromToken: makeNativeToken(100n), // < totalFee 150
        amount: undefined,
        bufferedGasFee: GAS,
        bufferedAdditiveFee: ADDITIVE
      })
      expect(error?.message).toContain(
        'Network and bridge fees exceed your balance'
      )
    })

    it('Case 4: returns amountExceedsBalanceAfterFees when fees + amount exceed balance', () => {
      const error = validateNativeToken({
        fromToken: makeNativeToken(200n), // covers fees (150) but not fees + amount (350)
        amount: 200n,
        bufferedGasFee: GAS,
        bufferedAdditiveFee: ADDITIVE
      })
      expect(error?.message).toContain('swap amount and fees')
    })

    it('returns undefined when balance covers fees + amount', () => {
      const error = validateNativeToken({
        fromToken: makeNativeToken(400n),
        amount: 200n,
        bufferedGasFee: GAS,
        bufferedAdditiveFee: ADDITIVE
      })
      expect(error).toBeUndefined()
    })
  })
})

// ─── validateNonNativeToken ───────────────────────────────────────────────────

describe('validateNonNativeToken', () => {
  const GAS = 100n
  const NATIVE_ADDITIVE = 50n // CCIP bridge fee in AVAX
  const SOURCE_ADDITIVE = 20n // deBridge fee in USDC
  const avaxNetwork = makeNetwork('AVAX', 18)

  describe('native balance checks', () => {
    it('Case 1: returns feesExceedNativeBalance when gas + CCIP bridge fee exceed native balance', () => {
      const error = validateNonNativeToken({
        fromToken: makeErc20Token(1000n),
        fromNetwork: avaxNetwork,
        nativeTokenBalance: 100n, // < gas(100) + nativeAdditive(50) = 150
        amount: undefined,
        bufferedGasFee: GAS,
        bufferedNativeAdditiveFee: NATIVE_ADDITIVE,
        bufferedAdditiveFee: 0n
      })
      expect(error?.message).toContain(
        'Network and bridge fees exceed your AVAX balance'
      )
    })

    it('Case 2: returns networkFeeExceedsNativeBalance when only gas exceeds native balance', () => {
      const error = validateNonNativeToken({
        fromToken: makeErc20Token(1000n),
        fromNetwork: avaxNetwork,
        nativeTokenBalance: 50n, // < gas(100), no native additive fee
        amount: undefined,
        bufferedGasFee: GAS,
        bufferedNativeAdditiveFee: 0n,
        bufferedAdditiveFee: 0n
      })
      expect(error?.message).toContain('Network fee exceeds your AVAX balance')
    })

    it('uses "native" symbol when network token is unavailable', () => {
      const error = validateNonNativeToken({
        fromToken: makeErc20Token(1000n),
        fromNetwork: undefined,
        nativeTokenBalance: 50n,
        amount: undefined,
        bufferedGasFee: GAS,
        bufferedNativeAdditiveFee: 0n,
        bufferedAdditiveFee: 0n
      })
      expect(error?.message).toContain('native')
    })

    it('returns undefined when native balance covers gas + CCIP bridge fee', () => {
      const error = validateNonNativeToken({
        fromToken: makeErc20Token(1000n),
        fromNetwork: avaxNetwork,
        nativeTokenBalance: 200n, // > 150
        amount: undefined,
        bufferedGasFee: GAS,
        bufferedNativeAdditiveFee: NATIVE_ADDITIVE,
        bufferedAdditiveFee: 0n
      })
      expect(error).toBeUndefined()
    })
  })

  describe('source token balance checks', () => {
    it('Case 3: returns bridgeFeeExceedsBalance when bridge fee alone exceeds token balance', () => {
      const error = validateNonNativeToken({
        fromToken: makeErc20Token(10n), // < SOURCE_ADDITIVE(20)
        fromNetwork: avaxNetwork,
        nativeTokenBalance: 200n,
        amount: undefined,
        bufferedGasFee: GAS,
        bufferedNativeAdditiveFee: 0n,
        bufferedAdditiveFee: SOURCE_ADDITIVE
      })
      expect(error?.message).toContain('Bridge fee exceeds your balance')
    })

    it('Case 4: returns amountExceedsBalanceAfterBridgeFee when fee + amount exceed token balance', () => {
      const error = validateNonNativeToken({
        fromToken: makeErc20Token(50n), // covers fee(20) but not fee + amount(70)
        fromNetwork: avaxNetwork,
        nativeTokenBalance: 200n,
        amount: 50n,
        bufferedGasFee: GAS,
        bufferedNativeAdditiveFee: 0n,
        bufferedAdditiveFee: SOURCE_ADDITIVE
      })
      expect(error?.message).toContain('bridge fee')
    })

    it('returns undefined when token balance covers fee + amount', () => {
      const error = validateNonNativeToken({
        fromToken: makeErc20Token(100n),
        fromNetwork: avaxNetwork,
        nativeTokenBalance: 200n,
        amount: 50n,
        bufferedGasFee: GAS,
        bufferedNativeAdditiveFee: 0n,
        bufferedAdditiveFee: SOURCE_ADDITIVE
      })
      expect(error).toBeUndefined()
    })

    it('skips source token check when additive fee is 0', () => {
      const error = validateNonNativeToken({
        fromToken: makeErc20Token(0n),
        fromNetwork: avaxNetwork,
        nativeTokenBalance: 200n,
        amount: 100n,
        bufferedGasFee: GAS,
        bufferedNativeAdditiveFee: 0n,
        bufferedAdditiveFee: 0n
      })
      expect(error).toBeUndefined()
    })
  })
})

describe('deriveValidationAdditiveBps', () => {
  it('subtracts the default reduction of 1000', () => {
    expect(deriveValidationAdditiveBps(4000)).toBe(3000)
  })

  it('accepts a custom reduction', () => {
    expect(deriveValidationAdditiveBps(5500, 500)).toBe(5000)
  })

  it('clamps to 0 when maxBps is less than the reduction', () => {
    expect(deriveValidationAdditiveBps(500)).toBe(0)
  })

  it('returns 0 when maxBps equals the reduction', () => {
    expect(deriveValidationAdditiveBps(1000)).toBe(0)
  })

  it('returns 0 when maxBps is 0', () => {
    expect(deriveValidationAdditiveBps(0)).toBe(0)
  })
})

// ─── getFeeEstimationError ────────────────────────────────────────────────────

const TX = '0xtx'

const makeEstimateError = (cause?: unknown): EstimateNativeFeeError =>
  new EstimateNativeFeeError({ errorCode: ErrorCode.VIEM_ERROR, tx: TX, cause })

const makeInsufficientFundsError = (
  insufficientTokenWasNative: boolean
): InsufficientFundsError =>
  new InsufficientFundsError({
    errorCode: ErrorCode.VIEM_ERROR,
    insufficientTokenWasNative
  })

describe('getFeeEstimationError', () => {
  describe('EstimateNativeFeeError with InsufficientFundsError cause', () => {
    it('returns insufficientFundsForFee with isNativeFeeIssue=true when insufficientTokenWasNative is true', () => {
      const error = makeEstimateError(makeInsufficientFundsError(true))
      const result = getFeeEstimationError(error)
      expect(result?.message).toBe('Insufficient native funds to cover the fee')
      expect(result?.kind).toBe('network-fee-only')
    })

    it('returns insufficientFundsForFee with isNativeFeeIssue=false when insufficientTokenWasNative is false', () => {
      const error = makeEstimateError(makeInsufficientFundsError(false))
      const result = getFeeEstimationError(error)
      expect(result?.message).toBe(
        'Insufficient token funds to estimate the fee'
      )
      expect(result?.kind).toBe('other')
    })
  })

  describe('EstimateNativeFeeError with undefined or unrecognised cause', () => {
    it('returns generic insufficientFundsForFee when cause is undefined', () => {
      const error = makeEstimateError(undefined)
      const result = getFeeEstimationError(error)
      expect(result?.message).toBe('Insufficient funds to estimate the fee')
      expect(result?.kind).toBe('provider-specific')
    })

    it('returns generic insufficientFundsForFee when cause is a non-InsufficientFundsError', () => {
      const error = makeEstimateError(new Error('rpc timeout'))
      const result = getFeeEstimationError(error)
      expect(result?.message).toBe('Insufficient funds to estimate the fee')
      expect(result?.kind).toBe('provider-specific')
    })
  })

  describe('SdkError with arithmetic underflow message', () => {
    it('returns swapAmountTooSmall tagged as provider-specific', () => {
      const error = new SdkError(
        'arithmetic underflow or overflow',
        ErrorCode.UNKNOWN
      )
      const result = getFeeEstimationError(error)
      expect(result?.message).toContain('too small')
      expect(result?.kind).toBe('provider-specific')
    })
  })

  describe('plain Error', () => {
    it('returns gasEstimationFailed warning', () => {
      const result = getFeeEstimationError(new Error('something went wrong'))
      expect(result?.message).toBe('Unable to estimate gas')
      expect(result?.isWarning).toBe(true)
    })
  })

  describe('unknown non-Error value', () => {
    it('returns gasEstimationFailed warning', () => {
      const result = getFeeEstimationError('string error')
      expect(result?.message).toBe('Unable to estimate gas')
      expect(result?.isWarning).toBe(true)
    })
  })

  it('always returns a FusionQuoteError — never undefined', () => {
    const result = getFeeEstimationError(new Error('any'))
    expect(result).toBeDefined()
  })
})

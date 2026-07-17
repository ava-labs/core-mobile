import { formatTokenAmount } from 'utils/Utils'
import { bigintToBig } from '@avalabs/core-utils-sdk'
import { TokenType } from '@avalabs/vm-module-types'
import type { LocalTokenWithBalance } from 'store/balance'
import { UNLIMITED_ORDERS } from 'features/recurringSwap/types'
import {
  computeRecurringBalanceError,
  type RecurringBalanceGateParams
} from './recurringBalanceGate'

const AVAX_DECIMALS = 18
const USDC_DECIMALS = 6

// Round, human-readable amounts so the assertions read clearly.
const AVAX = (whole: number, fraction = 0n): bigint =>
  BigInt(whole) * 10n ** 18n + fraction
const USDC = (whole: number): bigint => BigInt(whole) * 10n ** 6n

const SCHEDULE_FEE = 50_000_000_000_000_000n // 0.05 AVAX
const FIVE_AVAX = AVAX(5)
const FIVE_AVAX_PLUS_FEE = FIVE_AVAX + SCHEDULE_FEE // 5.05 AVAX
const FIVE_USDC = USDC(5)

const makeToken = (cfg: {
  type: TokenType
  balance: bigint
  decimals: number
  symbol: string
}): LocalTokenWithBalance =>
  ({
    ...cfg,
    address: cfg.type === TokenType.NATIVE ? '' : '0xtoken'
  } as unknown as LocalTokenWithBalance)

const nativeToken = (balance: bigint): LocalTokenWithBalance =>
  makeToken({
    type: TokenType.NATIVE,
    balance,
    decimals: AVAX_DECIMALS,
    symbol: 'AVAX'
  })
const erc20Token = (balance: bigint): LocalTokenWithBalance =>
  makeToken({
    type: TokenType.ERC20,
    balance,
    decimals: USDC_DECIMALS,
    symbol: 'USDC'
  })

// Native P/X-chain AVAX: `balance` includes staked/locked funds, `available` is
// the swappable portion (CP-14788).
const stakedNativeToken = (
  balance: bigint,
  available: bigint
): LocalTokenWithBalance =>
  ({
    type: TokenType.NATIVE,
    balance,
    available,
    decimals: AVAX_DECIMALS,
    symbol: 'AVAX',
    address: ''
  } as unknown as LocalTokenWithBalance)

// Mirror the gate's own formatting so assertions verify the *amount* passed
// (principal vs principal+fee) without hard-coding formatTokenAmount's output.
const fmt = (amount: bigint, decimals: number, symbol: string): string =>
  `${formatTokenAmount(bigintToBig(amount, decimals), decimals)} ${symbol}`

const params = (
  overrides: Partial<RecurringBalanceGateParams>
): RecurringBalanceGateParams => ({
  numberOfOrders: 5,
  totalAmountIn: FIVE_AVAX,
  additiveNativeFee: SCHEDULE_FEE,
  fromToken: nativeToken(AVAX(10)),
  nativeFromToken: nativeToken(AVAX(10)),
  ...overrides
})

describe('computeRecurringBalanceError — guards', () => {
  it('returns null until the quote total is known', () => {
    expect(
      computeRecurringBalanceError(params({ totalAmountIn: undefined }))
    ).toBeNull()
  })

  it('returns null when the order count is undefined', () => {
    expect(
      computeRecurringBalanceError(params({ numberOfOrders: undefined }))
    ).toBeNull()
  })

  it('returns null for Unlimited orders (no finite total to check)', () => {
    // Even with a balance far below the total, Unlimited can't be range-checked.
    expect(
      computeRecurringBalanceError(
        params({
          numberOfOrders: UNLIMITED_ORDERS,
          fromToken: nativeToken(AVAX(0))
        })
      )
    ).toBeNull()
  })
})

describe('computeRecurringBalanceError — native source', () => {
  it('is null when the native balance covers principal + schedule fee', () => {
    expect(
      computeRecurringBalanceError(
        params({ fromToken: nativeToken(FIVE_AVAX_PLUS_FEE) })
      )
    ).toBeNull()
  })

  it('errors when balance covers the principal but not principal + fee', () => {
    const err = computeRecurringBalanceError(
      params({ fromToken: nativeToken(FIVE_AVAX) }) // exactly 5 AVAX, need 5.05
    )
    // Quotes the FULL requirement (principal + fee), not just the principal.
    expect(err?.message).toBe(
      `Insufficient balance — 5 orders require ${fmt(
        FIVE_AVAX_PLUS_FEE,
        AVAX_DECIMALS,
        'AVAX'
      )}.`
    )
  })

  it('errors when the native balance is below the principal', () => {
    const err = computeRecurringBalanceError(
      params({ fromToken: nativeToken(AVAX(1, 830_000_000_000_000_000n)) }) // 1.83
    )
    expect(err?.message).toBe(
      `Insufficient balance — 5 orders require ${fmt(
        FIVE_AVAX_PLUS_FEE,
        AVAX_DECIMALS,
        'AVAX'
      )}.`
    )
  })

  it('does not block on a warning (the error is a blocking FusionQuoteError)', () => {
    const err = computeRecurringBalanceError(
      params({ fromToken: nativeToken(AVAX(0)) })
    )
    expect(err?.isWarning).toBeUndefined()
  })

  it('checks against available, not total balance, for staked P/X-chain AVAX (CP-14788)', () => {
    // Total balance (10) covers principal + fee (5.05), but only 3 is available
    // (rest staked) — the schedule must not pass validation on staked funds.
    const err = computeRecurringBalanceError(
      params({ fromToken: stakedNativeToken(AVAX(10), AVAX(3)) })
    )
    expect(err?.message).toBe(
      `Insufficient balance — 5 orders require ${fmt(
        FIVE_AVAX_PLUS_FEE,
        AVAX_DECIMALS,
        'AVAX'
      )}.`
    )
  })

  it('is null when available covers principal + fee for staked P/X-chain AVAX', () => {
    const err = computeRecurringBalanceError(
      params({ fromToken: stakedNativeToken(AVAX(100), FIVE_AVAX_PLUS_FEE) })
    )
    expect(err).toBeNull()
  })
})

describe('computeRecurringBalanceError — ERC-20 source', () => {
  const erc20Params = (
    overrides: Partial<RecurringBalanceGateParams>
  ): RecurringBalanceGateParams =>
    params({
      totalAmountIn: FIVE_USDC,
      fromToken: erc20Token(USDC(10)),
      nativeFromToken: nativeToken(AVAX(10)),
      ...overrides
    })

  it('is null when both balances are sufficient', () => {
    expect(computeRecurringBalanceError(erc20Params({}))).toBeNull()
  })

  it('token short, native enough → principal-only message', () => {
    const err = computeRecurringBalanceError(
      erc20Params({ fromToken: erc20Token(USDC(1)) })
    )
    expect(err?.message).toBe(
      `Insufficient balance — 5 orders require ${fmt(
        FIVE_USDC,
        USDC_DECIMALS,
        'USDC'
      )}.`
    )
  })

  it('token enough, native short → schedule-fee message', () => {
    const err = computeRecurringBalanceError(
      erc20Params({ nativeFromToken: nativeToken(AVAX(0)) })
    )
    expect(err?.message).toBe(
      `Insufficient balance — needs ${fmt(
        SCHEDULE_FEE,
        AVAX_DECIMALS,
        'AVAX'
      )} for the schedule fee.`
    )
  })

  it('both short → combined message', () => {
    const err = computeRecurringBalanceError(
      erc20Params({
        fromToken: erc20Token(USDC(1)),
        nativeFromToken: nativeToken(AVAX(0))
      })
    )
    expect(err?.message).toBe(
      `Insufficient balance — needs ${fmt(
        FIVE_USDC,
        USDC_DECIMALS,
        'USDC'
      )} and ${fmt(SCHEDULE_FEE, AVAX_DECIMALS, 'AVAX')} for the schedule fee.`
    )
  })

  it('no schedule fee (additiveNativeFee = 0) → fee branch is skipped', () => {
    expect(
      computeRecurringBalanceError(
        erc20Params({
          additiveNativeFee: 0n,
          nativeFromToken: nativeToken(AVAX(0))
        })
      )
    ).toBeNull()
  })

  it('native token unresolved → fee can not be checked, principal still can', () => {
    // nativeFromToken undefined: skip the fee check entirely.
    expect(
      computeRecurringBalanceError(erc20Params({ nativeFromToken: undefined }))
    ).toBeNull()
    // ...but a principal shortfall still surfaces (not the combined message).
    const err = computeRecurringBalanceError(
      erc20Params({
        fromToken: erc20Token(USDC(1)),
        nativeFromToken: undefined
      })
    )
    expect(err?.message).toBe(
      `Insufficient balance — 5 orders require ${fmt(
        FIVE_USDC,
        USDC_DECIMALS,
        'USDC'
      )}.`
    )
  })
})
